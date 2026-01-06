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
    if (images && images.length > 0) {
      const paths = images.map((img) => img.storage_path);

      const { error: storageError } = await supabaseAdmin.storage
        .from("project-images")
        .remove(paths);

      if (storageError) throw storageError;
    }

    // 3️⃣ Borrar imágenes de la BD
    const { error: deleteImagesError } = await supabaseAdmin
      .from("project_images")
      .delete()
      .eq("project_id", projectId);

    if (deleteImagesError) throw deleteImagesError;

    // 4️⃣ Borrar proyecto
    const { error: deleteProjectError } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (deleteProjectError) throw deleteProjectError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE PROJECT ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Error eliminando proyecto" },
      { status: 500 }
    );
  }
}
