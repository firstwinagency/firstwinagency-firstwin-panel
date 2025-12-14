import { supabase } from "./supabaseClient";

export type Project = {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
};

export type ProjectImage = {
  id: string;
  project_id: string;
  referencia: string | null;
  asin: string | null;
  filename: string;
  storage_path: string;
  mime: string;
  created_at: string;
};

/* =========================
   PROYECTOS
========================= */

export async function createProject(
  nombre: string,
  descripcion?: string
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert([{ nombre, descripcion }])
    .select()
    .single();

  if (error) {
    console.error("Error creando proyecto:", error);
    throw error;
  }

  return data;
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo proyectos:", error);
    throw error;
  }

  return data || [];
}

/* =========================
   IMÁGENES DEL PROYECTO
========================= */

export async function saveProjectImage(params: {
  project_id: string;
  referencia?: string | null;
  asin?: string | null;
  file: File;
}): Promise<ProjectImage> {
  const { project_id, referencia, asin, file } = params;

  const fileExt = file.name.split(".").pop();
  const safeName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${project_id}/${safeName}`;

  // 1️⃣ Subir imagen a Storage (SIN compresión)
  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error subiendo imagen:", uploadError);
    throw uploadError;
  }

  // 2️⃣ Guardar metadata en DB
  const { data, error } = await supabase
    .from("project_images")
    .insert([
      {
        project_id,
        referencia: referencia || null,
        asin: asin || null,
        filename: file.name,
        storage_path: storagePath,
        mime: file.type,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error guardando imagen en DB:", error);
    throw error;
  }

  return data;
}

export async function getProjectImages(
  project_id: string
): Promise<ProjectImage[]> {
  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", project_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error obteniendo imágenes:", error);
    throw error;
  }

  return data || [];
}

export async function deleteProjectImages(imageIds: string[]) {
  if (imageIds.length === 0) return;

  // 1️⃣ Obtener rutas de storage
  const { data: images } = await supabase
    .from("project_images")
    .select("storage_path")
    .in("id", imageIds);

  const paths = images?.map((img) => img.storage_path) || [];

  // 2️⃣ Borrar de storage
  if (paths.length > 0) {
    await supabase.storage.from("project-images").remove(paths);
  }

  // 3️⃣ Borrar de DB
  const { error } = await supabase
    .from("project_images")
    .delete()
    .in("id", imageIds);

  if (error) {
    console.error("Error borrando imágenes:", error);
    throw error;
  }
}

