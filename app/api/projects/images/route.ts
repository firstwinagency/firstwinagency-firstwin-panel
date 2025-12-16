import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_images")
      .select("id, reference, asin, storage_path")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("DB ERROR:", error);
      throw error;
    }

    const images = await Promise.all(
      data.map(async (img) => {
        const { data: signed, error: signError } =
          await supabaseAdmin.storage
            .from("project-images")
            .createSignedUrl(img.storage_path, 60 * 60);

        if (signError) {
          console.error("SIGNED URL ERROR:", signError);
          return null;
        }

        return {
          id: img.id,
          reference: img.reference,
          asin: img.asin,
          url: signed.signedUrl,
        };
      })
    );

    return NextResponse.json({
      images: images.filter(Boolean),
    });
  } catch (e) {
    console.error("IMAGES API FATAL ERROR:", e);
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
