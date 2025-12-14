import { supabase } from "./supabaseClient";

/**
 * =========================
 * PROJECTS
 * =========================
 */

export async function createProject(
  name: string,
  description?: string
) {
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        nombre: name,
        descripcion: description ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  return data;
}

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data;
}

/**
 * =========================
 * PROJECT IMAGES
 * =========================
 */

export type SaveProjectImageParams = {
  projectId: string;
  file: File | Blob;
  filename: string;
  mimeType: string;
  referencia?: string | null;
  asin?: string | null;
};

export async function saveProjectImage({
  projectId,
  file,
  filename,
  mimeType,
  referencia,
  asin,
}: SaveProjectImageParams) {
  /**
   * Estructura en storage:
   * project-images/{projectId}/{filename}
   */
  const storagePath = `${projectId}/${filename}`;

  // 1. Subir imagen a Storage (SIN pérdida de calidad)
  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw uploadError;
  }

  // 2. Guardar metadata en la base de datos
  const { data, error } = await supabase
    .from("project_images")
    .insert([
      {
        project_id: projectId,
        referencia: referencia ?? null,
        asin: asin ?? null,
        filename,
        mime: mimeType,
        storage_path: storagePath,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("DB insert image error:", error);
    throw error;
  }

  return data;
}

export async function getProjectImages(projectId: string) {
  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching project images:", error);
    throw error;
  }

  return data;
}

export async function deleteProjectImage(imageId: string, storagePath: string) {
  // 1. Borrar del storage
  const { error: storageError } = await supabase.storage
    .from("project-images")
    .remove([storagePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    throw storageError;
  }

  // 2. Borrar de la base de datos
  const { error: dbError } = await supabase
    .from("project_images")
    .delete()
    .eq("id", imageId);

  if (dbError) {
    console.error("DB delete image error:", dbError);
    throw dbError;
  }

  return true;
}

/**
 * =========================
 * HELPERS
 * =========================
 */

export function getPublicImageUrl(storagePath: string) {
  const { data } = supabase.storage
    .from("project-images")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
