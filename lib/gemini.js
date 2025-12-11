// lib/gemini.js
// ==============================================
// CONFIG
// ==============================================

// Acepta cualquiera de las dos variables de entorno
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY.");

// Modelos por defecto
const DEFAULT_MODEL_V2 = "gemini-2.5-flash-image-preview";
const DEFAULT_MODEL_V3 = "gemini-3.0-pro-image-preview";

// Punto base API
const API_ROOT = "https://generativelanguage.googleapis.com";

// Flags
const FORCE_REF_TO_1024 =
  String(process.env.FORCE_REF_TO_1024 || "true").toLowerCase() === "true";
const REF_FIT_MODE = (process.env.REF_FIT_MODE || "contain").toLowerCase();
const REF_BG = process.env.REF_BG || "#f6f6f6";

// Lazy load sharp
let _sharp = null;
async function getSharp() {
  if (_sharp) return _sharp;
  const s = await import("sharp");
  _sharp = s.default || s;
  return _sharp;
}

// ==============================================
// HELPERS
// ==============================================

/** Determina qué versión de API usa el modelo */
function modelConfig(modelId) {
  if (modelId.startsWith("gemini-2")) return { version: "v1beta" };
  if (modelId.startsWith("gemini-3")) return { version: "v1" };
  return { version: "v1" };
}

/** Normalizar a 1024x1024 */
async function toSquare1024(buffer, bgHex = "#f6f6f6") {
  const sharp = await getSharp();
  const meta = await sharp(buffer).metadata();
  const hasAlpha = !!meta.hasAlpha;

  const fit =
    REF_FIT_MODE === "cover"
      ? "cover"
      : REF_FIT_MODE === "fill"
      ? "fill"
      : "contain";

  const pipeline = sharp(buffer).resize(1024, 1024, {
    fit,
    background: bgHex,
  });

  if (hasAlpha) {
    return {
      mime: "image/png",
      buf: await pipeline.png().toBuffer(),
    };
  }

  return {
    mime: "image/jpeg",
    buf: await pipeline.jpeg({ quality: 95 }).toBuffer(),
  };
}

/** Descargar URL → inlineData */
async function urlToInlineData(url) {
  let res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo descargar: " + url);

  const buf = Buffer.from(await res.arrayBuffer());
  const { buf: finalBuf, mime } = await toSquare1024(buf, REF_BG);

  return {
    inlineData: {
      data: finalBuf.toString("base64"),
      mimeType: mime,
    },
  };
}

/** Extraer imágenes del JSON */
function extractImages(json) {
  const out = [];
  const cands = json?.candidates || [];
  for (const c of cands) {
    const parts = c?.content?.parts || [];
    for (const p of parts) {
      const block = p.inlineData || p.inline_data;
      if (block?.data && block?.mimeType?.startsWith("image/")) {
        out.push({
          base64: block.data,
          mime: block.mimeType,
        });
      }
    }
  }
  return out;
}

/** Llamada REST */
async function callGenerate(modelId, parts) {
  const { version } = modelConfig(modelId);
  const url = `${API_ROOT}/${version}/models/${modelId}:generateContent?key=${API_KEY}`;

  const body = {
    generationConfig: {
      temperature: 0.8,
      topK: 32,
      topP: 0.95,
    },
    contents: [{ role: "user", parts }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini Error ${res.status}: ${text}`);

  return JSON.parse(text);
}

/** Ejecuta una generación */
async function generateOnce(modelId, parts) {
  const json = await callGenerate(modelId, parts);
  const imgs = extractImages(json);
  if (!imgs.length) throw new Error("El modelo no devolvió imágenes.");
  return imgs[0];
}

// ==============================================
// API PRINCIPAL (la que usa /api/generate)
// ==============================================
export async function generateImage(prompt, refs, engine = "v2") {
  const model =
    engine === "v3" ? DEFAULT_MODEL_V3 : DEFAULT_MODEL_V2;

  const systemMsg =
    "Always output a single raster image. Always generate exactly 1024x1024 pixels.";

  const parts = [{ text: `${systemMsg}\n\n${prompt}` }];

  if (Array.isArray(refs) && refs.length) {
    const arr = refs.slice(0, 6).map(urlToInlineData);
    const files = await Promise.all(arr);
    parts.push(...files);
  }

  return await generateOnce(model, parts);
}

