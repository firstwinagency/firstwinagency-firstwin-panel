// app/api/generate/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import { PRESETS } from "../../../lib/presets";
import { generateImage } from "../../../lib/gemini";

export const runtime = "nodejs";

type ApiImage = { base64: string; mime?: string };

// =========================
// Utils
// =========================
function isBase64(ref: string) {
  return ref.startsWith("data:image/");
}

async function refToBase64(ref: string): Promise<string> {
  if (isBase64(ref)) {
    return ref.replace(/^data:image\/\w+;base64,/, "");
  }

  const res = await fetch(ref);
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen: ${ref}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

// =========================
// POST – generación masiva
// =========================
export async function POST(req: Request) {
  try {
    const body = JSON.parse(await req.text());

    const refsRaw: string[] = Array.isArray(body.refs) ? body.refs : [];
    const presetId = String(body.presetId || "");
    const count = Math.max(1, Math.min(Number(body.count) || 1, 6));

    // Motor IA
    const engine =
      body.model === "pro" || body.engine === "pro"
        ? "pro"
        : "standard";

    // Prompt
    let prompt = (body.overridePrompt || "").trim();
    if (!prompt) {
      const preset = PRESETS.find((p) => p.id === presetId);
      prompt = preset?.prompt || "";
    }
    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Falta prompt." },
        { status: 400 }
      );
    }

    if (!refsRaw.length) {
      return NextResponse.json(
        { ok: false, error: "Faltan imágenes de referencia." },
        { status: 400 }
      );
    }

    // refs → base64
    const refs = [];
    for (const r of refsRaw.slice(0, 6)) {
      refs.push(await refToBase64(r));
    }

    // Generación
    const images: ApiImage[] = [];
    for (let i = 0; i < count; i++) {
      const img = await generateImage(prompt, refs, engine);
      images.push(await padToSquare1024(img));
    }

    return NextResponse.json(
      { ok: true, presetId, images },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}

// =========================
// PAD 1024x1024
// =========================
async function padToSquare1024(imgIn: ApiImage): Promise<ApiImage> {
  const target = 1024;
  const bgColor = "#ffffff";

  const input = Buffer.from(imgIn.base64, "base64");
  const img = sharp(input).rotate();

  const resized = await img.resize(target, target, { fit: "inside" }).toBuffer();
  const meta = await sharp(resized).metadata();

  const left = Math.floor((target - (meta.width || target)) / 2);
  const top = Math.floor((target - (meta.height || target)) / 2);

  const out = await sharp(resized)
    .extend({
      top,
      bottom: target - (meta.height || target) - top,
      left,
      right: target - (meta.width || target) - left,
      background: bgColor,
    })
    .jpeg({ quality: 92 })
    .toBuffer();

  return {
    base64: out.toString("base64"),
    mime: "image/jpeg",
  };
}
