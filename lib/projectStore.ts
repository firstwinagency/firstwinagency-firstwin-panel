import { supabase } from "./supabaseClient";

/**
 * =========================
 * TIPOS
 * =========================
 */

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type SaveProjectImageInput = {
  projectId: string;
  file: File; // imagen FINAL en máxima calidad
  reference?: string;
  asin?: string;
};

/**
 * =========================
 * CREAR PROYECTO
 * =========================
 */

export async function createProject(input: CreateProjectInput) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  return data;
}

/**
 * =========================
 * GUARDAR IMAGEN EN PROYECTO
 * (Storage + DB)
 * =========================
 */

export async function saveProjectImage(input: SaveProjectImageInput) {
  const { projectId, file, reference, asin } = input;

  // 1️⃣ Generar nombre único
  const extension = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${extension}`;

  // 2️⃣ Ruta dentro del bucket
  const storagePath = `${projectId}/${filename}`;

  // 3️⃣ Subir imagen a Storage (SIN COMPRESIÓN)
  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    throw uploadError;
  }

  // 4️⃣ Guardar metadata en BD
  const { data, error: dbError } = await supabase
    .from("project_images")
    .insert({
      project_id: projectId,
      reference: reference ?? null,
      asin: asin ?? null,
      file_name: filename,
      mime_type: file.type,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Error saving image metadata:", dbError);
    throw dbError;
  }

  return data;
}

/**
 * =========================
 * OBTENER IMÁGENES DE UN PROYECTO
 * =========================
 */

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

/**
 * =========================
 * ELIMINAR IMÁGENES DEL PROYECTO
 * =========================
 */

export async function deleteProjectImages(imageIds: string[]) {
  // 1️⃣ Obtener rutas
  const { data: images, error } = await supabase
    .from("project_images")
    .select("storage_path")
    .in("id", imageIds);

  if (error) throw error;

  const paths = images.map((img) => img.storage_path);

  // 2️⃣ Borrar de Storage
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("project-images")
      .remove(paths);

    if (storageError) throw storageError;
  }

  // 3️⃣ Borrar de BD
  const { error: deleteError } = await supabase
    .from("project_images")
    .delete()
    .in("id", imageIds);

  if (deleteError) throw deleteError;

  return true;
}

