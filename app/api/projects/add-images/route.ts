import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { images } = body;

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const uploadedImages = [];

    // 1️⃣ Obtener el último índice actual
    const { data: lastImage } = await supabaseAdmin
      .from("project_images")
      .select("image_index")
      .order("image_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    let currentIndex = lastImage?.image_index ?? 0;

    for (const image of images) {
      const {
        base64,
        mime,
        filename,
        asin,
        reference,
      } = image;

      currentIndex += 1;

      const buffer = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      const storagePath = `default/${uuidv4()}-${filename}`;

      // 2️⃣ Subir imagen a Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from("project-images")
        .upload(storagePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 3️⃣ Guardar metadata COMPLETA en DB
      const { data, error: dbError } = await supabaseAdmin
        .from("project_images")
        .insert({
          project_id: null,
          reference: reference ?? null,
          asin: asin ?? null,
          image_index: currentIndex,
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
