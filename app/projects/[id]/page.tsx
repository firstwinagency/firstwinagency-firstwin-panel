"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* ======================================================
   TIPOS
====================================================== */
type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  index?: number;
  url?: string;
};

const CHUNK_SIZE = 100;
const IMAGES_PER_ROW = 6;

export default function ProjectGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  /* ======================================================
     ESTADO GALERÍA
  ====================================================== */
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadPart, setDownloadPart] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);
  const [order, setOrder] = useState<"oldest" | "newest">("oldest");

  /* ======================================================
     CARGA IMÁGENES
  ====================================================== */
  const loadImages = async () => {
    const res = await fetch(`/api/projects/images?projectId=${projectId}`);
    const data = await res.json();
    setImages(data.images || []);
    setSelected(new Set());
  };

  useEffect(() => {
    loadImages();
  }, [projectId]);

  /* ======================================================
     SELECCIÓN
  ====================================================== */
  const displayedImages =
    order === "oldest" ? images : [...images].reverse();

  const selectAll = () =>
    setSelected(new Set(displayedImages.map((img) => img.id)));

  const deselectAll = () => setSelected(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRowSelect = (rowIndex: number) => {
    const start = rowIndex * IMAGES_PER_ROW;
    const rowImages = displayedImages.slice(start, start + IMAGES_PER_ROW);

    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = rowImages.every((img) => next.has(img.id));
      rowImages.forEach((img) =>
        allSelected ? next.delete(img.id) : next.add(img.id)
      );
      return next;
    });
  };

  const toggleTwoRowsSelect = (rowIndex: number) => {
    const start = rowIndex * IMAGES_PER_ROW;
    const imgs = displayedImages.slice(
      start,
      start + IMAGES_PER_ROW * 2
    );

    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = imgs.every((img) => next.has(img.id));
      imgs.forEach((img) =>
        allSelected ? next.delete(img.id) : next.add(img.id)
      );
      return next;
    });
  };

  /* ======================================================
     ZIP
  ====================================================== */
  const downloadZip = async (mode: "reference" | "asin") => {
    const ids = Array.from(selected);
    if (!ids.length) return;

    const total = Math.ceil(ids.length / CHUNK_SIZE);
    setDownloading(true);
    setDownloadTotal(total);

    for (let i = 0; i < total; i++) {
      setDownloadPart(i + 1);
      const chunk = ids.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

      const res = await fetch("/api/projects/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: chunk, mode }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `imagenes_${mode}_part${i + 1}.zip`;
      a.click();

      URL.revokeObjectURL(url);
    }

    setDownloading(false);
    setDownloadPart(0);
    setDownloadTotal(0);
  };

  /* ======================================================
     BORRAR
  ====================================================== */
  const deleteImages = async () => {
    if (!selected.size) return;
    const ok = confirm("¿Estás seguro que deseas eliminar las imágenes?");
    if (!ok) return;

    await fetch("/api/projects/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });

    loadImages();
  };

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div style={{ height: "100vh", display: "flex", background: "#fff" }}>
      <div style={{ width: 22, background: "#ff6b6b" }} />

      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
        <button
          onClick={() => router.push("/projects")}
          style={{
            marginBottom: 16,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            opacity: 0.7,
          }}
        >
          ← Volver a proyectos
        </button>

        <h1
          style={{
            fontFamily: "DM Serif Display",
            fontSize: 34,
            textAlign: "center",
          }}
        >
          Proyectos
        </h1>

        <p style={{ textAlign: "center", opacity: 0.7 }}>
          Imágenes en proyecto: {images.length}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            margin: "24px 0",
            flexWrap: "wrap",
          }}
        >
          <button className="btn-zoom" onClick={selectAll}>Seleccionar todo</button>
          <button className="btn-zoom" onClick={deselectAll}>Deseleccionar</button>
          <button className="btn-zoom" onClick={() => downloadZip("reference")}>ZIP Referencia</button>
          <button className="btn-zoom" onClick={() => downloadZip("asin")}>ZIP ASIN</button>
          <button className="btn-zoom" onClick={() => setOrder(order === "oldest" ? "newest" : "oldest")}>
            Ordenar
          </button>
          <button className="btn-zoom" onClick={deleteImages}>Eliminar</button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 18,
          }}
        >
          {displayedImages.map((img, idx) => {
            const rowIndex = Math.floor(idx / IMAGES_PER_ROW);
            return (
              <div
                key={img.id}
                style={{
                  background: "#f2f2f2",
                  borderRadius: 16,
                  height: 240,
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => img.url && setPreview(img.url)}
              >
                <img
                  src={img.url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 22, background: "#ff6b6b" }} />

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={preview}
            style={{ maxWidth: "90%", maxHeight: "90%" }}
          />
        </div>
      )}
    </div>
  );
}
