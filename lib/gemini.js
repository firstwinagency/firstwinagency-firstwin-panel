import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateImage } from "../../../../lib/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const body = JSON.parse(raw || "{}");

    const prompt = body.prompt || "";
    const refs = Array.isArray(body.refs) ? body.refs : [];
    const width = Number(body.width);
    const height = Number(body.height);
    const format = String(body.format || "jpg").toLowerCase();

    // ⚠️ El frontend envía: "standard" | "pro"
    // Aquí lo convertimos a: "v2" | "v3"
    let engine = "v2";
    if (body.model === "pro") engine = "v3";

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Falta prompt." },
        { status: 400 }
      );
    }

    // === GENERAR CON GEMINI ===
    const imgObj = await generateImage(prompt, refs, engine);

    if (!imgObj?.base64) {
      throw new Error("Gemini no devolvió imagen.");
    }

    const buf = Buffer.from(imgObj.base64, "base64");

    // === AJUSTAR A TAMAÑO EXACTO ===
    let resized = sharp(buf).resize(width, height, { fit: "cover" });

    let finalBuf: Buffer;
    let mime = "";

    switch (format) {
      case "png":
        finalBuf = await resized.png().toBuffer();
        mime = "image/png";
        break;

      case "webp":
        finalBuf = await resized.webp().toBuffer();
        mime = "image/webp";
        break;

      case "bmp":
        finalBuf = await resized.png().toBuffer();
        mime = "image/bmp";
        break;

      default:
        finalBuf = await resized.jpeg({ quality: 95 }).toBuffer();
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


