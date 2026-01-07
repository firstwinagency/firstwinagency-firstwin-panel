import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, images } = body;

    // ✅ Validaciones básicas
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId requerido o inválido" },
        { status: 400 }
      );
    }

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Datos de imágenes inválidos" },
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
        image_index, // ✅ VIENE DEL PANEL MASIVO
      } = image;

      // Validación mínima
      if (typeof image_index !== "number") {
        return NextResponse.json(
          { error: "image_index inválido o ausente" },
          { status: 400 }
        );
      }

      if (!base64 || !filename || !mime) {
        return NextResponse.json(
          { error: "Datos de imagen incompletos" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      const storagePath = `default/${uuidv4()}-${filename}`;

      // 1️⃣ Subir imagen a Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from("project-images")
        .upload(storagePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2️⃣ Guardar metadata CORRECTA en DB
      const { data, error: dbError } = await supabaseAdmin
        .from("project_images")
        .insert({
          project_id: projectId, // ✅ FIX CRÍTICO
          reference: reference ?? null,
          asin: asin ?? null,
          image_index, // ✅ SE GUARDA TAL CUAL
          filename,
          mime,
          storage_path: storagePath,
        })
        .select()
        .single();

      if (dbError) throw dbError;

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
