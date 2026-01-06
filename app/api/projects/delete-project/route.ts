import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId requerido" },
        { status: 400 }
      );
    }

    // 1️⃣ Borrar imágenes del proyecto (DB)
    const { error: imagesError } = await supabaseAdmin
      .from("project_images")
      .delete()
      .eq("project_id", projectId);

    if (imagesError) throw imagesError;

    // 2️⃣ Borrar proyecto
    const { error: projectError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (projectError) throw projectError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE PROJECT ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Error eliminando proyecto" },
      { status: 500 }
    );
  }
}

