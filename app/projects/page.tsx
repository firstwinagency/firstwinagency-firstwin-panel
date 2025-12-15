"use client";

import { useState } from "react";

type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  index?: number;
};

export default function ProjectsPage() {
  const [images] = useState<ProjectImage[]>(
    Array.from({ length: 24 }).map((_, i) => ({
      id: String(i),
      // 🔴 NO ponemos textos fake
    }))
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);

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
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
      }}
    >
      {/* MARGEN IZQUIERDO CORAL */}
      <div style={{ width: 22, background: "#ff6b6b" }} />

      {/* CONTENIDO CENTRAL */}
      <div style={{ flex: 1, padding: "28px 36px" }}>
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
          <button className="btn-zoom" onClick={selectAll} style={{ background: "#ff6b6b", color: "#fff", borderRadius: 999 }}>
            Seleccionar todo
          </button>

          <button className="btn-zoom" onClick={deselectAll} style={{ borderRadius: 999 }}>
            Deseleccionar todo
          </button>

          <button className="btn-zoom" style={{ background: "#000", color: "#fff", borderRadius: 999 }}>
            Descargar ZIP (Referencia)
          </button>

          <button className="btn-zoom" style={{ background: "#ff6b6b", color: "#fff", borderRadius: 999 }}>
            Descargar ZIP (ASIN)
          </button>
        </div>

        {/* GALERÍA */}
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

              {/* CLICK PREVIEW */}
              <div
                onClick={() => setPreview("image")}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />

              {/* FRANJA INFERIOR (VACÍA HASTA DATOS REALES) */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 32,
                  background: "#6b6b6b",
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                {/* TEXTO REAL SE RENDERIZARÁ CUANDO EXISTA */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MARGEN DERECHO CORAL */}
      <div style={{ width: 22, background: "#ff6b6b" }} />

      {/* VISOR */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="viewer-overlay"
        >
          <div className="viewer-image" />
        </div>
      )}
    </div>
  );
}
