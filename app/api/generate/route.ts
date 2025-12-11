// app/api/generate/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import { PRESETS } from "../../../lib/presets";
import { generateImage } from "../../../lib/gemini";

export const runtime = "nodejs";

type ApiImage = { base64: string; mime?: string };

// =========================
// GET – health check
// =========================
export async function GET() {
  return NextResponse.json(
    { ok: true, endpoint: "/api/generate" },
    { status: 200 }
  );
}

// =========================
// POST – generación masiva
// =========================
export async function POST(req: Request) {
  try {
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

    const refs: string[] = Array.isArray(body?.refs) ? body.refs : [];
    const presetId: string = String(body?.presetId || "");
    const countRaw = Number(body?.count);
    const count = Math.max(1, Math.min(Number.isFinite(countRaw) ? countRaw : 1, 6));

    // Prompt desde override o preset
    let prompt: string = (body?.overridePrompt || "").trim();
    if (!prompt) {
      const preset = PRESETS.find((p) => p.id === presetId);
      prompt = (preset?.prompt || "").trim();
    }
    if (!prompt) {
      prompt = "Generate one high-quality e-commerce product image using the references.";
    }

    if (!refs.length) {
      return NextResponse.json(
        { ok: false, error: "Faltan URLs de referencia" },
        { status: 400 }
      );
    }

    // =========================
    // NUEVO MOTOR GEMINI SDK
    // =========================
    // Usamos SIEMPRE v3 para mejor calidad ("Nano Banana Pro")
    const images: ApiImage[] = [];

    for (let i = 0; i < count; i++) {
      const img = await generateImage(prompt, refs, "v3");
      images.push(img);
    }

    // Normalizar sin recortar
    const normalized = await Promise.all(images.map((im) => padToSquare1024(im)));

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

// =========================
// PAD A CUADRADO
// =========================
async function padToSquare1024(imgIn: ApiImage): Promise<ApiImage> {
  const bgColor = process.env.BG_SQUARE || "#ffffff";
  const target = 1024;

  const input = Buffer.from(imgIn.base64, "base64");
  let img = sharp(input, { limitInputPixels: false }).rotate();

  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  if (w > 0 && h > 0 && w === h) {
    const buf = await img
      .resize(target, target, { fit: "inside" })
      .jpeg({ quality: 92 })
      .toBuffer();
    return { base64: buf.toString("base64"), mime: "image/jpeg" };
  }

  const resized = await img
    .resize(target, target, { fit: "inside" })
    .toBuffer();

  const r = sharp(resized);
  const rMeta = await r.metadata();
  const rw = rMeta.width || target;
  const rh = rMeta.height || target;

  const left = Math.floor((target - rw) / 2);
  const right = target - rw - left;
  const top = Math.floor((target - rh) / 2);
  const bottom = target - rh - top;

  const out = await r
    .extend({ top, bottom, left, right, background: bgColor })
    .jpeg({ quality: 92 })
    .toBuffer();

  return { base64: out.toString("base64"), mime: "image/jpeg" };
}

