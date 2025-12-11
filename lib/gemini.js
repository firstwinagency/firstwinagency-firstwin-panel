// ==============================================
// GEMINI SDK — COMPATIBLE CON NANOBANANA PRO
// ==============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Tu API Key desde Vercel
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY");

// Crear cliente Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// Modelos finales y correctos
const MODEL_V2 = "gemini-2.5-flash-image";
const MODEL_V3 = "gemini-3.0-pro-image"; // ⭐ Nano Banana Pro oficial

// ==============================================
// CONVERTIR REFERENCIA BASE64 EN PART
// ==============================================
function createInlinePart(base64) {
  return {
    inlineData: {
      data: base64.replace(/^data:image\/\w+;base64,/, ""),
      mimeType: "image/jpeg",
    },
  };
}

// ==============================================
// GENERAR IMAGEN SIMPLE CON MODELO SELECCIONADO
// ==============================================
export async function generateImage(prompt, refs = [], engine = "v2") {
  const modelName = engine === "v3" ? MODEL_V3 : MODEL_V2;
  const model = genAI.getGenerativeModel({ model: modelName });

  // Construcción de partes
  const parts = [{ text: prompt }];

  // Añadimos hasta 5 referencias
  if (Array.isArray(refs) && refs.length > 0) {
    refs.slice(0, 5).forEach((r) => {
      parts.push(createInlinePart(r));
    });
  }

  // Solicitud de imagen
  const result = await model.generateImage({
    prompt,
    // Inyección correcta de referencias
    image: refs.slice(0, 5).map((r) => ({
      inlineData: {
        data: r.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg",
      },
    })),
    size: "1024x1024",
  });

  // Recuperar imagen generada
  const img = result.response?.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData
  );

  if (!img) throw new Error("Gemini no devolvió ninguna imagen.");

  return {
    base64: img.inlineData.data,
    mime: img.inlineData.mimeType || "image/jpeg",
  };
}



