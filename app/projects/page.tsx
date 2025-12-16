"use client";

import { useEffect, useState } from "react";

type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  index?: number;
  url?: string;
};

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const res = await fetch("/api/projects/images");
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        console.error("Error cargando imágenes", err);
      } finally {
        setLoading(false);
      }
    };

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

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex" }}>
      {/* MARGEN IZQUIERDO */}
      <div style={{ width: 22, background: "#ff6b6b" }} />

      {/* CONTENIDO */}
      <div
        style={{
          flex: 1,
          padding: "28px 36px",
          overflowY: "auto",
          height: "100vh",
        }}
      >
        {/* TÍTULO */}
        <h1
          style={{
            fontFamily: "DM Serif Display",
            fontSize: 34,
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          Proyectos
        </h1>

        {/* BOTONES (NO SE TOCAN) */}
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
            style={{
              background: "#ff6b6b",
              color: "#fff",
              borderRadius: 999,
            }}
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
            style={{
              background: "#000",
              color: "#fff",
              borderRadius: 999,
            }}
          >
            Descargar ZIP (Referencia)
          </button>

          <button
            className="btn-zoom"
            style={{
              background: "#ff6b6b",
              color: "#fff",
              borderRadius: 999,
            }}
          >
            Descargar ZIP (ASIN)
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
            {images.map((img) => (
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
              >
                {/* CHECK */}
                <div
                  onClick={() => toggleSelect(img.id)}
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

                {/* IMAGEN */}
                {img.url && (
                  <img
                    src={img.url}
                    alt=""
                    onClick={() => setPreview(img.url!)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {/* FRANJA INFERIOR */}
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
                  {img.reference && <span>{img.reference}</span>}
                  {img.reference && img.asin && <span>|</span>}
                  {img.asin && <span>{img.asin}</span>}
                  {img.index !== undefined && <span>| #{img.index}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MARGEN DERECHO */}
      <div style={{ width: 22, background: "#ff6b6b" }} />

      {/* VISOR */}
      {preview && (
        <div onClick={() => setPreview(null)} className="viewer-overlay">
          <img src={preview} className="viewer-image" />
        </div>
      )}
    </div>
  );
}
