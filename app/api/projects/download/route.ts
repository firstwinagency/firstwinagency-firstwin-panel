import { NextRequest } from "next/server";
import JSZip from "jszip";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageIds, mode } = body as {
      imageIds: string[];
      mode: "reference" | "asin";
    };

    if (!imageIds || imageIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay imágenes seleccionadas" }),
        { status: 400 }
      );
    }

    if (mode !== "reference" && mode !== "asin") {
      return new Response(
        JSON.stringify({ error: "Modo inválido" }),
        { status: 400 }
      );
    }

    // 1️⃣ Obtener metadata de imágenes
    const { data: images, error } = await supabaseAdmin
      .from("project_images")
      .select(
        `
        id,
        reference,
        asin,
        index,
        storage_path,
        mime
      `
      )
      .in("id", imageIds);

    if (error || !images || images.length === 0) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: "No se pudieron cargar las imágenes" }),
        { status: 500 }
      );
    }

    // 2️⃣ Crear ZIP
    const zip = new JSZip();

    for (const img of images) {
      if (!img.storage_path) continue;

      // Descargar archivo desde Supabase Storage
      const { data: fileData, error: downloadError } =
        await supabaseAdmin.storage
          .from("project-images")
          .download(img.storage_path);

      if (downloadError || !fileData) {
        console.warn("Error descargando:", img.storage_path);
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();

      // Extensión
      const ext =
        img.mime?.includes("png")
          ? "png"
          : img.mime?.includes("webp")
          ? "webp"
          : img.mime?.includes("gif")
          ? "gif"
          : "jpg";

      // Nombre base
      const baseName =
        mode === "asin"
          ? img.asin || img.reference || "imagen"
          : img.reference || img.asin || "imagen";

      const indexSuffix =
        typeof img.index === "number" ? `_${img.index}` : "";

      const filename = `${baseName}${indexSuffix}.${ext}`;

      zip.file(filename, arrayBuffer);
    }

    // 3️⃣ Generar ZIP (FORMA CORRECTA PARA NEXT 14)
    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
    });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=imagenes_${mode}.zip`,
      },
    });
  } catch (err) {
    console.error("DOWNLOAD ZIP ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Error interno generando ZIP" }),
      { status: 500 }
    );
  }
}

