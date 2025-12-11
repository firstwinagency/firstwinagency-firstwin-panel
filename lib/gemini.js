// ==============================================
// GEMINI SDK — COMPATIBLE CON NANOBANANA PRO
// ==============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// API key
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY");

// Cliente Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// Modelos correctos
const MODEL_V2 = "gemini-2.5-flash-image";
const MODEL_V3 = "gemini-3.0-pro-image"; // Nano Banana Pro

// Convertir referencia base64 → inlineData
function asInline(base64) {
  return {
    inlineData: {
      data: base64.replace(/^data:image\/\w+;base64,/, ""),
      mimeType: "image/jpeg",
    },
  };
}

// ==============================================
// GENERAR IMAGEN USANDO generateContent()
// ==============================================
export async function generateImage(prompt, refs = [], engine = "v2") {
  const modelName = engine === "v3" ? MODEL_V3 : MODEL_V2;

  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  // Construcción de partes
  const parts = [{ text: prompt }];

  if (Array.isArray(refs) && refs.length) {
    refs.slice(0, 5).forEach((r) => parts.push(asInline(r)));
  }

  // Llamada correcta de generación de imagen
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

  // Extraer imágenes según SDK oficial
  const images =
    response?.candidates?.[0]?.content?.parts?.filter(
      (p) => p.inlineData && p.inlineData.mimeType.startsWith("image/")
    ) || [];

  if (!images.length) throw new Error("Gemini no devolvió ninguna imagen.");

  const img = images[0];

  return {
    base64: img.inlineData.data,
    mime: img.inlineData.mimeType,
  };
}

