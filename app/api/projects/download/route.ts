import { NextResponse } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { ids, mode } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    if (!["reference", "asin"].includes(mode)) {
      return NextResponse.json(
        { error: "Modo inválido" },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener imágenes
    const { data: images, error } = await supabaseAdmin
      .from("project_images")
      .select("*")
      .in("id", ids);

    if (error) throw error;

    const zip = new JSZip();

    // 2️⃣ Descargar y añadir al ZIP
    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      const { data } = await supabaseAdmin.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const buffer = Buffer.from(await data.arrayBuffer());

      const baseName =
        mode === "reference"
          ? img.reference || "sin-referencia"
          : img.asin || "sin-asin";

      const index = img.index ?? i + 1;
      const ext = img.filename?.split(".").pop() || "jpg";

      const fileName = `${baseName}_${index}.${ext}`;

      zip.file(fileName, buffer);
    }

    // 3️⃣ Generar ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=imagenes_${mode}.zip`,
      },
    });
  } catch (error: any) {
    console.error("ZIP ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Error generando ZIP" },
      { status: 500 }
    );
  }
}
