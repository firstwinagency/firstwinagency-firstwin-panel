"use client";

import { useEffect, useState } from "react";

type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  index?: number;
  url?: string;
};

const CHUNK_SIZE = 100;
const COLUMNS = 6;

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    mode: "reference" | "asin" | null;
  }>({ current: 0, total: 0, mode: null });

  const loadImages = async () => {
    try {
      const res = await fetch("/api/projects/images");
      const data = await res.json();
      setImages(data.images || []);
      setSelected(new Set());
    } catch (err) {
      console.error("Error cargando imágenes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const selectAll = () =>
    setSelected(new Set(images.map((img) => img.id)));

  const deselectAll = () => setSelected(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* =======================
     DESCARGAR ZIP (CHUNKS + PROGRESO)
  ======================= */
  const downloadZip = async (mode: "reference" | "asin") => {
    if (selected.size === 0) {
      alert("Selecciona al menos una imagen");
      return;
    }

    const ids = Array.from(selected);
    const totalParts = Math.ceil(ids.length / CHUNK_SIZE);

    setDownloadProgress({ current: 0, total: totalParts, mode });

    for (let part = 0; part < totalParts; part++) {
      setDownloadProgress({
        current: part + 1,
        total: totalParts,
        mode,
      });

      const chunk = ids.slice(
        part * CHUNK_SIZE,
        (part + 1) * CHUNK_SIZE
      );

      const res = await fetch("/api/projects/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: chunk, mode }),
      });

      if (!res.ok) {
        alert(`Error generando ZIP (parte ${part + 1})`);
        setDownloadProgress({ current: 0, total: 0, mode: null });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `imagenes_${mode}_part${part + 1}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      await new Promise((r) => setTimeout(r, 300));
    }

    setDownloadProgress({ current: 0, total: 0, mode: null });
  };

  /* =======================
     ELIMINAR IMÁGENES
  ======================= */
  const deleteImages = async () => {
    if (selected.size === 0) return;

    const ok = confirm("¿Estás seguro que deseas eliminar?");
    if (!ok) return;

    const res = await fetch("/api/projects/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: Array.from(selected),
      }),
    });

    if (!res.ok) {
      alert("Error eliminando imágenes");
      return;
    }

    await loadImages();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex" }}>
      <div style={{ width: 22, background: "#ff6b6b" }} />

      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
        <h1
          style={{
            fontFamily: "DM Serif Display",
            fontSize: 34,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Proyectos
        </h1>

        <p style={{ textAlign: "center", marginBottom: 18, opacity: 0.7 }}>
          Imágenes en proyecto: {images.length}
        </p>

        {/* PROGRESO */}
        {downloadProgress.total > 0 && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
              Descargando ZIP {downloadProgress.current} de{" "}
              {downloadProgress.total} (
              {downloadProgress.mode})
            </div>
            <div
              style={{
                width: 300,
                height: 8,
                background: "#eee",
                margin: "0 auto",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${
                    (downloadProgress.current /
                      downloadProgress.total) *
                    100
                  }%`,
                  height: "100%",
                  background: "#ff6b6b",
                }}
              />
            </div>
          </div>
        )}

        {/* BOTONES */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <button className="btn-zoom" onClick={selectAll}>
            Seleccionar todo
          </button>
          <button className="btn-zoom" onClick={deselectAll}>
            Deseleccionar todo
          </button>
          <button
            className="btn-zoom"
            onClick={() => downloadZip("reference")}
            disabled={downloadProgress.total > 0}
          >
            Descargar ZIP (Referencia)
          </button>
          <button
            className="btn-zoom"
            onClick={() => downloadZip("asin")}
            disabled={downloadProgress.total > 0}
          >
            Descargar ZIP (ASIN)
          </button>
          <button
            className="btn-zoom"
            onClick={deleteImages}
            disabled={selected.size === 0}
          >
            Eliminar
          </button>
        </div>

        {/* GALERÍA */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
            gap: 18,
          }}
        >
          {images.map((img, idx) => {
            const rowStart = Math.floor(idx / COLUMNS) * COLUMNS;
            const rowImages = images.slice(rowStart, rowStart + COLUMNS);
            const rowIds = rowImages.map((i) => i.id);
            const rowSelected = rowIds.every((id) => selected.has(id));

            return (
              <div
                key={img.id}
                style={{
                  background: "#f2f2f2",
                  borderRadius: 16,
                  height: 240,
                  position: "relative",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
                onClick={() => img.url && setPreview(img.url)}
              >
                {/* CHECK INDIVIDUAL */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(img.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 18,
                    height: 18,
                    background: selected.has(img.id)
                      ? "#ff6b6b"
                      : "#fff",
                    border: "1px solid #ccc",
                    zIndex: 2,
                  }}
                />

                {/* CHECK FILA */}
                {idx % COLUMNS === 0 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => {
                        const next = new Set(prev);
                        rowIds.forEach((id) =>
                          rowSelected ? next.delete(id) : next.add(id)
                        );
                        return next;
                      });
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      left: -26,
                      width: 18,
                      height: 18,
                      background: rowSelected ? "#000" : "#fff",
                      border: "1px solid #ccc",
                    }}
                  />
                )}

                {img.url && (
                  <img
                    src={img.url}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
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
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}
