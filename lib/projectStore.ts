import { openDB, DBSchema, IDBPDatabase } from "idb";

export type ProjectImage = {
  id: string;
  projectId: string;
  reference: string;
  asin?: string;
  presetId: string;
  order: number;
  mime: string;
  base64: string;
  createdAt: number;
};

interface ProjectDB extends DBSchema {
  images: {
    key: string;
    value: ProjectImage;
    indexes: {
      "by-project": string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ProjectDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ProjectDB>("kreative360-projects", 1, {
      upgrade(db) {
        const store = db.createObjectStore("images", {
          keyPath: "id",
        });
        store.createIndex("by-project", "projectId");
      },
    });
  }
  return dbPromise;
}

// ===============================
// API PÚBLICA
// ===============================

export async function addImageToProject(image: ProjectImage) {
  const db = await getDB();
  await db.put("images", image);
}

export async function getProjectImages(projectId: string) {
  const db = await getDB();
  return db.getAllFromIndex("images", "by-project", projectId);
}

export async function removeProjectImage(imageId: string) {
  const db = await getDB();
  await db.delete("images", imageId);
}

export async function clearProject(projectId: string) {
  const db = await getDB();
  const images = await getProjectImages(projectId);
  const tx = db.transaction("images", "readwrite");
  for (const img of images) {
    tx.store.delete(img.id);
  }
  await tx.done;
}
