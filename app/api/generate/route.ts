import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const body = JSON.parse(raw);

    const prompt = body.prompt || "";
    const refs = Array.isArray(body.refs) ? body.refs : [];

    const width = Number(body.width);
    const height = Number(body.height);
    const format = String(body.format || "jpg").toLowerCase();

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Falta prompt." },
        { status: 400 }
      );
    }

    // ==== IMPORTAMOS GEMINI ====
    const mod: any = await import("../../../lib/gemini");
    const generateImageGemini25 = mod.generateImageGemini25;

    // ==== GENERAMOS CON 1 IMAGEN ====
    const result = await generateImageGemini25(prompt, refs, 1);

    const baseImg = result[0];

    // ==== PASAMOS A BUFFER ====
    const buf = Buffer.from(baseImg.base64, "base64");

    // ==== PROCESAMOS A TAMAÑO EXACTO ====
    let img = sharp(buf).resize(width, height, {
      fit: "cover",
    });

    // ==== FORMATO ====
    let finalBuf: Buffer;
    let mime = "";

    switch (format) {
      case "png":
        finalBuf = await img.png().toBuffer();
        mime = "image/png";
        break;

      case "webp":
        finalBuf = await img.webp().toBuffer();
        mime = "image/webp";
        break;

      case "bmp":
        finalBuf = await img.bmp().toBuffer();
        mime = "image/bmp";
        break;

      default:
        finalBuf = await img.jpeg({ quality: 95 }).toBuffer();
        mime = "image/jpeg";
        break;
    }

    return NextResponse.json(
      {
        ok: true,
        image: {
          base64: finalBuf.toString("base64"),
          mime,
          width,
          height,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
