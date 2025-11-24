// lib/gemini.js
// Acepta cualquiera de las dos variables de entorno
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY.");

const PRIMARY_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview";
const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || PRIMARY_MODEL;

const API_ROOT = "https://generativelanguage.googleapis.com";

// ======== Flags de control (tamaño y encaje de referencias) ======== //
const FORCE_REF_TO_1024 = String(process.env.FORCE_REF_TO_1024 || "true").toLowerCase() === "true";
const REF_FIT_MODE = (process.env.REF_FIT_MODE || "contain").toLowerCase(); // contain | cover | fill
const REF_BG = process.env.REF_BG || "#f6f6f6";

// @lazy: import dinámico de sharp para no romper dev/local si no está instalado aún
let _sharp = null;
async function getSharp() {
  if (_sharp) return _sharp;
  try {
    const s = await import("sharp");
    _sharp = s.default || s;
    return _sharp;
  } catch {
    throw new Error(
      "No se pudo cargar 'sharp'. Añádelo a package.json (npm i sharp) y vuelve a desplegar."
    );
  }
}

/** ========= Helpers ========= **/

/**
 * Base de tu app para construir URL ABSOLUTA cuando corremos en servidor.
 */
const SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Devuelve la URL del proxy interno; en server usa absoluta, en cliente relativa */
const proxify = (u) => {
  const q = `?url=${encodeURIComponent(u)}`;
  if (typeof window === "undefined") {
    return `${SERVER_BASE_URL}/api/img${q}`;
  }
  return `/api/img${q}`;
};

/** Regla: qué versión de API usar según el modelo */
function modelConfig(modelId) {
  if (/^gemini-2\./i.test(modelId)) return { version: "v1beta" };
  return { version: "v1" };
}

/**
 * Transforma un buffer de imagen a lienzo 1024×1024 usando sharp.
 * - fit=contain (default): mantiene proporciones, rellena con REF_BG
 * - fit=cover: recorta para cubrir 1024×1024
 * - fit=fill: estira a 1024×1024 (puede deformar)
 */
async function toSquare1024(buffer, bgHex = "#f6f6f6") {
  const sharp = await getSharp();
  const meta = await sharp(buffer).metadata();
  const hasAlpha = !!meta.hasAlpha;

  const fit =
    REF_FIT_MODE === "cover" ? "cover" :
    REF_FIT_MODE === "fill"  ? "fill"  :
    "contain";

  const pipeline = sharp(buffer).resize(1024, 1024, {
    fit,
    background: bgHex,
  });

  // Si hay alfa o queremos preservar transparencias, usa PNG; si no, JPEG para menor peso
  if (hasAlpha) {
    return { mime: "image/png", buf: await pipeline.png({ compressionLevel: 9 }).toBuffer() };
  }
  return { mime: "image/jpeg", buf: await pipeline.jpeg({ quality: 95 }).toBuffer() };
}

/** Descarga URL y devuelve { inlineData: { data, mimeType } } usando SIEMPRE el proxy */
async function urlToInlineData(url) {
  // 1) intenta con proxy interno (sin pedir AVIF)
  let res = await fetch(proxify(url), {
    cache: "no-store",
    headers: { Accept: "image/webp,image/jpeg,image/png,image/*;q=0.8" },
  });

  // 2) si falla, reintenta una vez contra la URL original (por si el proxy cae)
  if (!res.ok) {
    res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "image/webp,image/jpeg,image/png,image/*;q=0.8" },
    });
  }

  // 3) si aún viene AVIF, forzamos conversión vía weserv a JPG
  let ct = res.headers.get("content-type") || "";
  if (ct.includes("image/avif")) {
    const via = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
    res = await fetch(via, {
      cache: "no-store",
      headers: { Accept: "image/jpeg,image/*;q=0.8" },
    });
    ct = res.headers.get("content-type") || "";
  }

  if (!res.ok) {
    throw new Error(`No pude descargar la referencia: ${url} (${res.status})`);
  }

  const originalBuf = Buffer.from(await res.arrayBuffer());

  // Deducir mime base
  let mime = (ct || "").split(";")[0].trim();
  if (!mime || (!mime.startsWith("image/") && mime !== "application/octet-stream")) {
    const ext = (url.split("?")[0].split("#")[0].split(".").pop() || "").toLowerCase();
    mime =
      ext === "png"  ? "image/png"  :
      ext === "webp" ? "image/webp" :
      ext === "gif"  ? "image/gif"  :
      "image/jpeg";
  } else if (mime === "application/octet-stream" || mime === "image/avif") {
    mime = "image/jpeg";
  }

  // === AQUÍ FORZAMOS 1024×1024 EN LAS REFERENCIAS ===
  let finalBuf = originalBuf;
  let finalMime = mime;
  if (FORCE_REF_TO_1024) {
    const { buf, mime: outMime } = await toSquare1024(originalBuf, REF_BG);
    finalBuf = buf;
    finalMime = outMime;
  }

  const base64 = finalBuf.toString("base64");
  return { inlineData: { data: base64, mimeType: finalMime } };
}

/** Extrae imágenes { base64, mime } del JSON de generateContent */
function extractImages(json) {
  const out = [];
  const cands = json?.candidates || [];
  for (const c of cands) {
    const parts = c?.content?.parts || [];
    for (const p of parts) {
      const id = p?.inlineData || p?.inline_data;
      if (id?.data && (id?.mimeType || id?.mime_type)?.startsWith?.("image/")) {
        out.push({ base64: id.data, mime: id.mimeType || id.mime_type });
      }
      if (Array.isArray(p?.generatedImages)) {
        for (const gi of p.generatedImages) {
          const gid = gi?.inlineData || gi?.inline_data;
          if (gid?.data && (gid?.mimeType || gid?.mime_type)?.startsWith?.("image/")) {
            out.push({ base64: gid.data, mime: gid.mimeType || gid.mime_type });
          }
        }
      }
    }
  }
  return out;
}

/** Llama al endpoint correcto (v1 o v1beta) según el modelo */
async function callGenerate(modelId, parts) {
  const { version } = modelConfig(modelId);
  const endpoint = `${API_ROOT}/${version}/models/${modelId}:generateContent?key=${API_KEY}`;

  const body = {
    generationConfig: {
      temperature: 0.8,
      topK: 32,
      topP: 0.95,
    },
    contents: [{ role: "user", parts }],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    let detail = text;
    try { detail = JSON.parse(text); } catch {}
    throw new Error(
      `Gemini REST error ${res.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respuesta de Gemini no es JSON: ${text?.slice?.(0, 400) || ""}`);
  }
}

/** Genera UNA imagen con el modelo dado */
async function generateOnce(modelId, parts) {
  const json = await callGenerate(modelId, parts);
  const imgs = extractImages(json);
  if (!imgs.length) throw new Error(`El modelo "${modelId}" no devolvió imágenes.`);
  return imgs[0];
}

/** API pública para tu /api/generate */
export async function generateImageGemini25(prompt, refs = [], count = 1) {
  const systemMsg = [
    "Always output a single raster image.",
    "When user references images, adopt their canvas size; here all references are normalized to 1024×1024.",
    "So, generate exactly 1024×1024 pixels.",
  ].join(" ");

  const parts = [{ text: `${systemMsg}\n\n${prompt || ""}` }];

  if (Array.isArray(refs) && refs.length) {
    const files = await Promise.all(refs.slice(0, 6).map(urlToInlineData));
    parts.push(...files);
  }

  const results = [];
  while (results.length < count) {
    try {
      const img = await generateOnce(PRIMARY_MODEL, parts);
      results.push(img);
    } catch (err) {
      console.warn("[Gemini] Primario falló:", err?.message || err);
      if (FALLBACK_MODEL && FALLBACK_MODEL !== PRIMARY_MODEL) {
        try {
          const imgFb = await generateOnce(FALLBACK_MODEL, parts);
          results.push(imgFb);
        } catch (err2) {
          throw new Error(
            `Falló primario y fallback. Primario: ${err?.message || err}. ` +
            `Fallback: ${err2?.message || err2}`
          );
        }
      } else {
        throw err;
      }
    }
  }

  return results.slice(0, count);
}

