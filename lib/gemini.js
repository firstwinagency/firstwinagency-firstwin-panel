// ==============================================
// GEMINI — STANDARD (SDK) + PRO (REST v1)
// ==============================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("Falta GOOGLE_API_KEY o GEMINI_API_KEY");

const genAI = new GoogleGenerativeAI(API_KEY);

// ==============================
// Utils
// ==============================
function isBase64Image(input) {
  return (
    typeof input === "string" &&
    (input.startsWith("data:image/") ||
      /^[A-Za-z0-9+/=]+$/.test(input.slice(0, 40)))
  );
}

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

async function refToBase64(ref) {
  if (isBase64Image(ref)) {
    return ref.replace(/^data:image\/\w+;base64,/, "");
  }
  return await fetchImageAsBase64(ref);
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

  if (!img) throw new Error("Standard: no se generó imagen");

  return {
    base64: img.inlineData.data,
    mime: img.inlineData.mimeType,
  };
}

// ==============================
// PRO — Gemini 3.0 (REST v1)
// ==============================
async function generatePro(prompt, refs) {
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

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-3.0-pro-image:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Pro Error: ${JSON.stringify(json)}`);
  }

  const img =
    json?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

  if (!img) throw new Error("Pro: no se generó imagen");

  return {
    base64: img.inlineData.data,
    mime: img.inlineData.mimeType,
  };
}

// ==============================
// API PÚBLICA
// ==============================
export async function generateImage(prompt, refs = [], engine = "v2") {
  if (engine === "v3") {
    return await generatePro(prompt, refs);
  }
  return await generateStandard(prompt, refs);
}
