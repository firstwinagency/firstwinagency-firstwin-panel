import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_images")
      .select("id, reference, asin, index, storage_path")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const images = await Promise.all(
      data.map(async (img) => {
        const { data: signed } = await supabaseAdmin
          .storage
          .from("project-images")
          .createSignedUrl(img.storage_path, 60 * 60); // 1 hora

        return {
          id: img.id,
          reference: img.reference,
          asin: img.asin,
          index: img.index,
          url: signed?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ images });
  } catch (err) {
    console.error("PROJECT IMAGES ERROR", err);
    return NextResponse.json(
      { error: "Error cargando imágenes" },
      { status: 500 }
    );
  }
}
