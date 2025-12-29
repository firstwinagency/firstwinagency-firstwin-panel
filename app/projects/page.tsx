"use client";

import { useEffect, useMemo, useState } from "react";

type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  index?: number;
  url?: string;
};

const CHUNK_SIZE = 100;
const IMAGES_PER_ROW = 6;

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState(false);
  const [downloadPart, setDownloadPart] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);

  const [order, setOrder] = useState<"oldest" | "newest">("oldest");

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

  const orderedImages = useMemo(() => {
    if (order === "oldest") return images;
    return [...images].reverse();
  }, [images, order]);

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

  const toggleRowSelect = (rowIndex: number) => {
    const start = rowIndex * IMAGES_PER_ROW;
    const rowImages = orderedImages.slice(start, start + IMAGES_PER_ROW);

    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = rowImages.every((img) => next.has(img.id));

      rowImages.forEach((img) => {
        allSelected ? next.delete(img.id) : next.add(img.id);
      });

      return next;
    });
  };

  const toggleTwoRowsSelect = (rowIndex: number) => {
    const start = rowIndex * IMAGES_PER_ROW;
    const rows = orderedImages.slice(start, start + IMAGES_PER_ROW * 2);

    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = rows.every((img) => next.has(img.id));

      rows.forEach((img) => {
        allSelected ? next.delete(img.id) : next.add(img.id);
      });

      return next;
    });
  };

  const downloadZip = async (mode: "reference" | "asin") => {
    if (selected.size === 0) {
      alert("Selecciona al menos una imagen");
      return;
    }

    const ids = Array.from(selected);
    const totalParts = Math.ceil(ids.length / CHUNK_SIZE);

    setDownloading(true);
    setDownloadTotal(totalParts);

    for (let part = 0; part < totalParts; part++) {
      setDownloadPart(part + 1);

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
        setDownloading(false);
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

    setDownloading(false);
    setDownloadPart(0);
    setDownloadTotal(0);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex" }}>
      <div style={{ width: 22, background: "#ff6b6b" }} />

      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
        <h1 style={{ fontFamily: "DM Serif Display", fontSize: 34, textAlign: "center" }}>
          Proyectos
        </h1>

        <p style={{ textAlign: "center", opacity: 0.7 }}>
          Imágenes en proyecto: {images.length}
        </p>

        {downloading && (
          <div style={{ maxWidth: 420, margin: "20px auto" }}>
            <p style={{ textAlign: "center", fontSize: 14 }}>
              Descargando ZIP {downloadPart} de {downloadTotal}
            </p>
            <div style={{ height: 8, background: "#e0e0e0", borderRadius: 6 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(downloadPart / downloadTotal) * 100}%`,
                  background: "#ff6b6b",
                }}
              />
            </div>
          </div>
        )}

        {/* BOTONES + FILTRO */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-zoom" onClick={selectAll} style={{ background: "#ff6b6b", color: "#fff", borderRadius: 999 }}>
            Seleccionar todo
          </button>

          <button className="btn-zoom" onClick={deselectAll} style={{ borderRadius: 999 }}>
            Deseleccionar todo
          </button>

          <button className="btn-zoom" onClick={() => downloadZip("reference")} style={{ background: "#000", color: "#fff", borderRadius: 999 }}>
            Descargar ZIP (Referencia)
          </button>

          <button className="btn-zoom" onClick={() => downloadZip("asin")} style={{ background: "#ff6b6b", color: "#fff", borderRadius: 999 }}>
            Descargar ZIP (ASIN)
          </button>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as any)}
            style={{ borderRadius: 999, padding: "6px 12px" }}
          >
            <option value="oldest">Más antiguas → más nuevas</option>
            <option value="newest">Más nuevas → más antiguas</option>
          </select>
        </div>

        {/* GALERÍA */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 18, marginTop: 28 }}>
          {orderedImages.map((img, idx) => {
            const rowIndex = Math.floor(idx / IMAGES_PER_ROW);
            const isRowStart = idx % IMAGES_PER_ROW === 0;
            const isTwoRowDivider = idx % (IMAGES_PER_ROW * 2) === IMAGES_PER_ROW;

            return (
              <div key={img.id} style={{ background: "#f2f2f2", borderRadius: 16, height: 240, position: "relative", cursor: "pointer" }}>
                {isRowStart && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowSelect(rowIndex);
                    }}
                    style={{ position: "absolute", top: 10, left: 10, width: 18, height: 18, borderRadius: 4, background: "#fff", border: "1px solid #ccc" }}
                  />
                )}

                {isTwoRowDivider && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTwoRowsSelect(rowIndex - 1);
                    }}
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: "#ff6b6b",
                      cursor: "pointer",
                    }}
                  />
                )}

                <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "#6b6b6b", color: "#fff", fontSize: 12, display: "flex", justifyContent: "center", gap: 6 }}>
                  <span>{img.reference || "REF"}</span>
                  <span>|</span>
                  <span>{img.asin || "ASIN"}</span>
                  <span>| #{img.index ?? idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 22, background: "#ff6b6b" }} />
    </div>
  );
}
