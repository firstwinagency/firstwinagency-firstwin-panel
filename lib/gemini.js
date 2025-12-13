// ==============================================
// GEMINI SDK — COMPATIBLE CON STANDARD Y PRO
// (PictureLab + Panel Masivo)
// ==============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// API key
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY");

// Cliente Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// Modelos
const MODEL_V2 = "gemini-2.5-flash-image";
const MODEL_V3 = "gemini-3.0-pro-image"; // Nano Banana Pro

// ==============================
// Utils
// ==============================

// Detecta si es base64 (data:image/... o raw base64)
function isBase64Image(input) {
  return (
    typeof input === "string" &&
    (input.startsWith("data:image/") ||
      /^[A-Za-z0-9+/=]+$/.test(input.slice(0, 50)))
  );
}

// Descargar URL y convertir a base64
async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen: ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}

// Convertir referencia (base64 o URL) → inlineData
async function refToInline(ref) {
  let base64;

  if (isBase64Image(ref)) {
    base64 = ref.replace(/^data:image\/\w+;base64,/, "");
  } else {
    // Es URL → descargar
    base64 = await fetchImageAsBase64(ref);
  }

  return {
    inlineData: {
      data: base64,
      mimeType: "image/jpeg",
    },
  };
}

// ==============================================
// GENERAR IMAGEN
// ==============================================
export async function generateImage(prompt, refs = [], engine = "v2") {
  const modelName = engine === "v3" ? MODEL_V3 : MODEL_V2;

  const model = genAI.getGenerativeModel({ model: modelName });

  const parts = [{ text: prompt }];

  if (Array.isArray(refs) && refs.length) {
    for (const ref of refs.slice(0, 5)) {
      parts.push(await refToInline(ref));
    }
  }

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });

  const response = await result.response;

  const images =
    response?.candidates?.[0]?.content?.parts?.filter(
      (p) => p.inlineData && p.inlineData.mimeType.startsWith("image/")
    ) || [];

  if (!images.length) {
    throw new Error("Gemini no devolvió ninguna imagen.");
  }

  const img = images[0];

  return {
    base64: img.inlineData.data,
    mime: img.inlineData.mimeType,
  };
}


