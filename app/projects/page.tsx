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

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
     DESCARGAR ZIP (CHUNKS)
  ======================= */
  const downloadZip = async (mode: "reference" | "asin") => {
    if (selected.size === 0) {
      alert("Selecciona al menos una imagen");
      return;
    }

    const ids = Array.from(selected);
    const totalParts = Math.ceil(ids.length / CHUNK_SIZE);

    for (let part = 0; part < totalParts; part++) {
      const chunk = ids.slice(
        part * CHUNK_SIZE,
        (part + 1) * CHUNK_SIZE
      );

      const res = await fetch("/api/projects/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: chunk,
          mode,
        }),
      });

      if (!res.ok) {
        alert(`Error generando ZIP (parte ${part + 1})`);
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

      // Pequeña pausa para no saturar el navegador
      await new Promise((r) => setTimeout(r, 300));
    }
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

      <div
        style={{
          flex: 1,
          padding: "28px 36px",
          overflowY: "auto",
          height: "100vh",
        }}
      >
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
          <button
            className="btn-zoom"
            onClick={selectAll}
            style={{ background: "#ff6b6b", color: "#fff", borderRadius: 999 }}
          >
            Seleccionar todo
          </button>

          <button
            className="btn-zoom"
            onClick={deselectAll}
            style={{ borderRadius: 999 }}
          >
            Deseleccionar todo
          </button>

          <button
            className="btn-zoom"
            onClick={() => downloadZip("reference")}
            style={{ background: "#000", color: "#fff", borderRadius: 999 }}
          >
            Descargar ZIP (Referencia)
          </button>

          <button
            className="btn-zoom"
            onClick={() => downloadZip("asin")}
            style={{ background: "#ff6b6b", color: "#fff", borderRadius: 999 }}
          >
            Descargar ZIP (ASIN)
          </button>

          <button
            className="btn-zoom"
            disabled={selected.size === 0}
            onClick={deleteImages}
            style={{
              background: "#6b1d1d",
              color: "#fff",
              borderRadius: 999,
              opacity: selected.size === 0 ? 0.5 : 1,
            }}
          >
            Eliminar
          </button>
        </div>

        {/* GALERÍA */}
        {loading ? (
          <p style={{ textAlign: "center" }}>Cargando imágenes…</p>
        ) : images.length === 0 ? (
          <p style={{ textAlign: "center" }}>
            No hay imágenes enviadas al proyecto todavía
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 18,
            }}
          >
            {images.map((img, idx) => (
              <div
                key={img.id}
                style={{
                  background: "#f2f2f2",
                  borderRadius: 16,
                  height: 240,
                  position: "relative",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                }}
                onClick={() => img.url && setPreview(img.url)}
              >
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
                    borderRadius: 4,
                    background: selected.has(img.id) ? "#ff6b6b" : "#fff",
                    border: "1px solid #ccc",
                    zIndex: 2,
                  }}
                />

                {img.url && (
                  <img
                    src={img.url}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 32,
                    background: "#6b6b6b",
                    color: "#fff",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span>{img.reference || "REF"}</span>
                  <span>|</span>
                  <span>{img.asin || "ASIN"}</span>
                  <span>| #{img.index ?? idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 22, background: "#ff6b6b" }} />

      {/* VISOR */}
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
            cursor: "zoom-out",
          }}
        >
          <img
            src={preview}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 0 40px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}
    </div>
  );
}


