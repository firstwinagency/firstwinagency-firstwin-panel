import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * ⛔ DESACTIVAR CACHÉ DE NEXT.JS (CLAVE)
 * Esto hace que los cambios en DB se reflejen INSTANTÁNEAMENTE
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_images")
      .select(`
        id,
        reference,
        asin,
        image_index,
        storage_path,
        created_at
      `)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ images: [] }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ images: [] });
    }

    const images = data
      .map((img) => {
        if (!img.storage_path) return null;

        const { data: urlData } = supabaseAdmin.storage
          .from("project-images")
          .getPublicUrl(img.storage_path);

        if (!urlData?.publicUrl) return null;

        return {
          id: img.id,
          reference: img.reference,
          asin: img.asin,
          index: img.image_index,
          url: urlData.publicUrl,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Fatal error:", err);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
