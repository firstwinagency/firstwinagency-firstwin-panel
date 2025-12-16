import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    /* 1️⃣ Obtener imágenes de BD */
    const { data, error } = await supabaseAdmin
      .from("project_images")
      .select(`
        id,
        reference,
        asin,
        index,
        storage_path
      `)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json({ images: [] }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ images: [] });
    }

    /* 2️⃣ Generar URLs públicas */
    const images = data.map((img) => {
      const { data: urlData } = supabaseAdmin
        .storage
        .from("project-images")
        .getPublicUrl(img.storage_path);

      return {
        id: img.id,
        reference: img.reference ?? null,
        asin: img.asin ?? null,
        index: img.index ?? null,
        url: urlData.publicUrl,
      };
    });

    return NextResponse.json({ images });

  } catch (err) {
    console.error("API /projects/images error:", err);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
