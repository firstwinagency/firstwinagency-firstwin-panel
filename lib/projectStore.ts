// lib/projectStore.ts
import { createClient } from "@supabase/supabase-js";

/**
 * ⚠️ IMPORTANTE
 * Estas variables DEBEN existir en tu .env.local
 *
 * NEXT_PUBLIC_SUPABASE_URL=
 * SUPABASE_SERVICE_ROLE_KEY=
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==============================
// TIPOS
// ==============================

export type ProjectImageInput = {
  projectId: string;
  reference: string; // referencia del CSV
  asin?: string;     // ASIN opcional
  presetId: string;
  order: number;     // 0,1,2,3...
  mime: string;      // image/jpeg, image/png...
  base64: string;    // imagen FINAL, SIN recomprimir
};

export type StoredProjectImage = {
  id: string;
  project_id: string;
  reference: string;
  asin: string | null;
  preset_id: string;
  order: number;
  storage_path: string;
  mime: string;
  created_at: string;
};

// ==============================
// CREAR PROYECTO
// ==============================

export async function createProject(name: string) {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==============================
// GUARDAR IMAGEN EN PROYECTO
// ==============================

export async function saveImageToProject(input: ProjectImageInput) {
  const {
    projectId,
    reference,
    asin,
    presetId,
    order,
    mime,
    base64,
  } = input;

  // 👉 extensión correcta
  const ext =
    mime.includes("png")
      ? "png"
      : mime.includes("webp")
      ? "webp"
      : mime.includes("bmp")
      ? "bmp"
      : "jpg";

  // 👉 ruta en Storage (NO se sobrescribe nada)
  const filePath = `${projectId}/${reference}/${presetId}_${order}.${ext}`;

  const buffer = Buffer.from(base64, "base64");

  // ==============================
  // SUBIR A STORAGE (SIN TOCAR CALIDAD)
  // ==============================
  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(filePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // ==============================
  // GUARDAR METADATOS EN BD
  // ==============================
  const { data, error } = await supabase
    .from("project_images")
    .insert({
      project_id: projectId,
      reference,
      asin: asin || null,
      preset_id: presetId,
      order,
      storage_path: filePath,
      mime,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==============================
// OBTENER IMÁGENES DE UN PROYECTO
// ==============================

export async function getProjectImages(projectId: string) {
  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("reference", { ascending: true })
    .order("order", { ascending: true });

  if (error) throw error;
  return data as StoredProjectImage[];
}

// ==============================
// BORRAR IMÁGENES DEL PROYECTO
// ==============================

export async function deleteProjectImages(imageIds: string[]) {
  if (!imageIds.length) return;

  // 1️⃣ obtener paths
  const { data, error } = await supabase
    .from("project_images")
    .select("storage_path")
    .in("id", imageIds);

  if (error) throw error;

  const paths = data.map((d) => d.storage_path);

  // 2️⃣ borrar de storage
  await supabase.storage
    .from("project-images")
    .remove(paths);

  // 3️⃣ borrar de BD
  await supabase
    .from("project_images")
    .delete()
    .in("id", imageIds);
}

// ==============================
// BORRAR PROYECTO COMPLETO
// ==============================

export async function deleteProject(projectId: string) {
  // borrar imágenes
  const images = await getProjectImages(projectId);
  const paths = images.map((i) => i.storage_path);

  if (paths.length) {
    await supabase.storage
      .from("project-images")
      .remove(paths);
  }

  // borrar filas
  await supabase.from("project_images").delete().eq("project_id", projectId);
  await supabase.from("projects").delete().eq("id", projectId);
}

