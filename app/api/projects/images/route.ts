import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ images: [] });
    }

    const { data, error } = await supabaseAdmin
      .from("project_images")
      .select(`
        id,
        project_id,
        reference,
        asin,
        filename,
        created_at
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ images: [] }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ images: [] });
    }

    const images = data
      .map((img, index) => {
        if (!img.filename) return null;

        const storagePath = `${img.project_id}/${img.filename}`;

        const { data: urlData } = supabaseAdmin.storage
          .from("project-images")
          .getPublicUrl(storagePath);

        if (!urlData?.publicUrl) return null;

        return {
          id: img.id,
          reference: img.reference,
          asin: img.asin,
          index: index + 1,
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
