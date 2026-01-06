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

    // 1️⃣ Obtener imágenes del proyecto
    const { data: images, error: fetchError } = await supabaseAdmin
      .from("project_images")
      .select("storage_path")
      .eq("project_id", projectId);

    if (fetchError) throw fetchError;

    // 2️⃣ Borrar archivos del storage
    const paths = images
      .map((img) => img.storage_path)
      .filter(Boolean);

    if (paths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("project-images")
        .remove(paths);

      if (storageError) throw storageError;
    }

    // 3️⃣ Borrar imágenes de la BD
    await supabaseAdmin
      .from("project_images")
      .delete()
      .eq("project_id", projectId);

    // 4️⃣ Borrar proyecto
    const { error: projectError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (projectError) throw projectError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE PROJECT ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Error eliminando proyecto" },
      { status: 500 }
    );
  }
}
