// ==============================================
// GOOGLE IMAGE GENERATION — STANDARD + PRO
// ==============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY");

const genAI = new GoogleGenerativeAI(API_KEY);

// ==============================
// Utils
// ==============================
function isBase64(ref) {
  return (
    ref.startsWith("data:image/") ||
    /^[A-Za-z0-9+/=]+$/.test(ref.slice(0, 40))
  );
}

async function refToBase64(ref) {
  // Ya es base64
  if (isBase64(ref)) {
    return ref.replace(/^data:image\/\w+;base64,/, "");
  }

  // Es URL → descargar
  const res = await fetch(ref);
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen: ${ref}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

// ==============================
// STANDARD — Gemini 2.5 (SDK)
// ==============================
async function generateStandard(prompt, refs) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image",
  });

  const parts = [{ text: prompt }];

  for (const r of refs.slice(0, 5)) {
    const base64 = await refToBase64(r);
    parts.push({
      inlineData: {
        data: base64,
        mimeType: "image/jpeg",
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  const img =
    result.response?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

  if (!img) {
    throw new Error("Standard: no se generó imagen");
  }

  return {
    base64: img.inlineData.data,
    mime: img.inlineData.mimeType || "image/jpeg",
  };
}

// ==============================
// PRO — IMAGEN 3 (REST v1)
// ==============================
async function generatePro(prompt, refs) {
  // Imagen 3 solo acepta 1 imagen de referencia
  const images = [];

  if (refs.length > 0) {
    const base64 = await refToBase64(refs[0]);
    images.push({
      image: { base64 },
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-001:generate?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        images,
      }),
    }
  );

  // 🔒 LECTURA SEGURA (CLAVE PARA EVITAR EL ERROR ACTUAL)
  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      "Imagen Pro: respuesta no válida del servidor (no es JSON)\n\n" + text
    );
  }

  if (!res.ok) {
    throw new Error(
      "Imagen Pro Error:\n" + JSON.stringify(json, null, 2)
    );
  }

  const img = json?.images?.[0];
  if (!img?.base64) {
    throw new Error("Pro: no se generó imagen");
  }

  return {
    base64: img.base64,
    mime: "image/png",
  };
}

// ==============================
// API UNIFICADA
// ==============================
export async function generateImage(prompt, refs = [], engine = "v2") {
  if (engine === "v3") {
    return await generatePro(prompt, refs);
  }
  return await generateStandard(prompt, refs);
}
