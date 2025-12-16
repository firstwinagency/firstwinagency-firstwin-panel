import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const images = data.map((img) => {
      const { data: publicUrl } = supabaseAdmin
        .storage
        .from("project-images")
        .getPublicUrl(img.storage_path);

      return {
        id: img.id,
        reference: img.reference,
        asin: img.asin,
        url: publicUrl.publicUrl,
        createdAt: img.created_at,
      };
    });

    return NextResponse.json({ images });
  } catch (err: any) {
    console.error("LIST PROJECT IMAGES ERROR:", err);
    return NextResponse.json(
      { error: "Error cargando imágenes" },
      { status: 500 }
    );
  }
}

