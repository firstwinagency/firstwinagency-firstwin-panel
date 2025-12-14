import { supabase } from "./supabaseClient";
import JSZip from "jszip";

/**
 * =========================
 * PROYECTOS
 * =========================
 */

export async function createProject(name: string, description?: string) {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, description })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * =========================
 * IMÁGENES DEL PROYECTO
 * =========================
 */

export async function saveImageToProject({
  projectId,
  reference,
  asin,
  file,
}: {
  projectId: string;
  reference: string;
  asin: string;
  file: File;
}) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${projectId}/${fileName}`;

  // 1️⃣ Subir imagen a Storage (SIN tocar calidad)
  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  // 2️⃣ Guardar metadata en BD
  const { error: dbError } = await supabase.from("project_images").insert({
    project_id: projectId,
    reference,
    asin,
    file_name: fileName,
    mime: file.type,
    storage_path: storagePath,
  });

  if (dbError) throw dbError;
}

export async function getProjectImages(projectId: string) {
  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteProjectImages(imageIds: string[]) {
  const { data, error } = await supabase
    .from("project_images")
    .delete()
    .in("id", imageIds)
    .select("storage_path");

  if (error) throw error;

  // borrar también del storage
  if (data?.length) {
    const paths = data.map((img) => img.storage_path);
    await supabase.storage.from("project-images").remove(paths);
  }
}

/**
 * =========================
 * ZIP DEL PROYECTO
 * =========================
 */

export async function downloadProjectZip({
  projectId,
  mode,
}: {
  projectId: string;
  mode: "reference" | "asin";
}) {
  const images = await getProjectImages(projectId);
  const zip = new JSZip();

  let counterMap: Record<string, number> = {};

  for (const img of images) {
    const { data } = await supabase.storage
      .from("project-images")
      .download(img.storage_path);

    if (!data) continue;

    const key = mode === "reference" ? img.reference : img.asin;
    counterMap[key] = (counterMap[key] || 0) + 1;

    const ext = img.file_name.split(".").pop();
    const fileName = `${key}_${counterMap[key]}.${ext}`;

    zip.file(fileName, data);
  }

  const blob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `project_${projectId}_${mode}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}


