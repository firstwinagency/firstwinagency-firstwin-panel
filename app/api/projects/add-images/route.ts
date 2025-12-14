import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      projectId,
      images, // [{ base64, mime, filename, asin, reference }]
    } = body;

    if (!projectId || !images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (const image of images) {
      const {
        base64,
        mime,
        filename,
        asin,
        reference,
      } = image;

      const buffer = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      const storagePath = `${projectId}/${uuidv4()}-${filename}`;

      // 1️⃣ Subir imagen a Storage (SIN pérdida de calidad)
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(storagePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2️⃣ Guardar metadata en DB
      const { data, error: dbError } = await supabase
        .from("project_images")
        .insert({
          project_id: projectId,
          reference,
          asin,
          filename,
          mime,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      uploadedImages.push(data);
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    });
  } catch (error: any) {
    console.error("ADD IMAGES ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
