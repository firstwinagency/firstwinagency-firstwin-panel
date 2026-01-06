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

    if (imagesError) {
      console.error(imagesError);
      return NextResponse.json(
        { error: "Error eliminando imágenes" },
        { status: 500 }
      );
    }

    // 2️⃣ Borrar proyecto
    const { error: projectError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (projectError) {
      console.error(projectError);
      return NextResponse.json(
        { error: "Error eliminando proyecto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
