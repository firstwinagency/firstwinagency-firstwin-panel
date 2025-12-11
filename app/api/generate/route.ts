app/api/generate/route.ts

// app/api/generate/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import { PRESETS } from "../../../lib/presets";

export const runtime = "nodejs";

type ApiImage = { base64: string; mime?: string };

// GET simple para health-check
export async function GET() {
  return NextResponse.json(
    { ok: true, endpoint: "/api/generate" },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  try {
    // 1) Body seguro
    const raw = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json(
        { ok: false, error: "Body JSON inválido" },
        { status: 400 }
      );
    }

    // 2) Entradas
    const refs: string[] = Array.isArray(body?.refs) ? body.refs : [];
    const presetId: string = String(body?.presetId || "");
    const countRaw = Number(body?.count);
    const count = Math.max(
      1,
      Math.min(Number.isFinite(countRaw) ? countRaw : 1, 6)
    );

    // 3) Prompt
    let prompt: string = (body?.overridePrompt || "").trim();
    if (!prompt) {
      const preset = PRESETS.find((p) => p.id === presetId);
      prompt = (preset?.prompt || "").trim();
    }
    if (!prompt) {
      prompt =
        "Generate one high-quality e-commerce product image using the references.";
    }

    if (!refs.length) {
      return NextResponse.json(
        { ok: false, error: "Faltan URLs de referencia" },
        { status: 400 }
      );
    }

    // 4) Motor (import dinámico para no romper el build si falta)
    let generateImageGemini25: any;
    try {
      const mod: any = await import("../../../lib/gemini");
      generateImageGemini25 =
        mod.generateImageGemini25 || mod.default?.generateImageGemini25;
      if (typeof generateImageGemini25 !== "function") {
        throw new Error("No se encontró la función generateImageGemini25.");
      }
    } catch (e: any) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudo cargar el motor de Gemini: " +
            String(e?.message || e),
        },
        { status: 500 }
      );
    }

    // 5) Generar (lib/gemini ya proxifica las refs)
    const rawImages: ApiImage[] = await generateImageGemini25(
      prompt,
      refs,
      count
    );

    // 6) Normalizar SIN RECORTAR a 1024x1024
    const normalized = await Promise.all(
      rawImages.map((im) => padToSquare1024(im))
    );

    // 7) Respuesta
    return NextResponse.json(
      { ok: true, presetId, promptUsed: prompt, images: normalized },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * Convierte cualquier imagen en un lienzo 1024x1024 SIN RECORTAR NADA:
 * - Redimensiona con fit:"inside" (mantiene todo el contenido).
 * - Extiende el lienzo a cuadrado añadiendo bandas del color indicado (por defecto blanco).
 * - Exporta a JPEG calidad 92.
 *
 * Para ajustar el color de fondo, define BG_SQUARE (hex o css) en variables de entorno:
 *   BG_SQUARE="#ffffff" (default)
 */
async function padToSquare1024(imgIn: ApiImage): Promise<ApiImage> {
  const bgColor = process.env.BG_SQUARE || "#ffffff";
  const target = 1024;

  const input = Buffer.from(imgIn.base64, "base64");
  let img = sharp(input, { limitInputPixels: false }).rotate();

  // Metadatos para calcular márgenes
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  // Si ya es cuadrada solo escala
  if (w > 0 && h > 0 && w === h) {
    const buf = await img
      .resize(target, target, { fit: "inside", withoutEnlargement: false })
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
      .toBuffer();
    return { base64: buf.toString("base64"), mime: "image/jpeg" };
  }

  // Escala "inside" para no recortar contenido
  const resized = await img
    .resize(target, target, { fit: "inside", withoutEnlargement: false })
    .toBuffer();

  const r = sharp(resized, { limitInputPixels: false });
  const rMeta = await r.metadata();
  const rw = rMeta.width || target;
  const rh = rMeta.height || target;

  // Calcula márgenes para cuadrado
  const left = Math.floor((target - rw) / 2);
  const right = target - rw - left;
  const top = Math.floor((target - rh) / 2);
  const bottom = target - rh - top;

  const out = await r
    .extend({ top, bottom, left, right, background: bgColor })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();

  return { base64: out.toString("base64"), mime: "image/jpeg" };
}
