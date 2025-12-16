import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("project_images")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ images: [] }, { status: 500 });
    }

    console.log("IMAGES FROM DB:", data);

    if (!data || data.length === 0) {
      return NextResponse.json({ images: [] });
    }

    const images = data.map((img: any) => {
      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(img.storage_path);

      return {
        id: img.id,
        reference: img.reference,
        asin: img.asin,
        index: img.index,
        url: urlData.publicUrl,
      };
    });

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Fatal error:", err);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
