"use client";

import { useState } from "react";

type ProjectImage = {
  id: string;
  src?: string;
  selected: boolean;
};

const MAX_SLOTS = 24; // 4 filas x 6 columnas (puedes cambiarlo)

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>(
    Array.from({ length: MAX_SLOTS }).map((_, i) => ({
      id: `slot-${i}`,
      src: undefined,
      selected: false,
    }))
  );

  const toggleSelect = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const selectAll = () => {
    setImages((prev) => prev.map((img) => ({ ...img, selected: true })));
  };

  const deleteSelected = () => {
    setImages((prev) =>
      prev.map((img) =>
        img.selected ? { ...img, src: undefined, selected: false } : img
      )
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ff6b6b",
        padding: "0 24px",
      }}
    >
      {/* CONTENEDOR BLANCO */}
      <div
        style={{
          background: "#ffffff",
          minHeight: "100vh",
          padding: "32px 32px 48px",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: "#15181c",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Proyectos
          </h1>

          {/* BOTONES */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button className="project-btn">Descargar ZIP (Referencia)</button>
            <button className="project-btn">Descargar ZIP (ASIN)</button>
            <button className="project-btn" onClick={selectAll}>
              Seleccionar todo
            </button>
            <button
              className="project-btn danger"
              onClick={deleteSelected}
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => toggleSelect(img.id)}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: 14,
                border: img.selected
                  ? "2px solid #ff6b6b"
                  : "1px solid #e5e7eb",
                background: img.src ? "#000" : "#f3f4f6",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {img.src ? (
                <img
                  src={img.src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    userSelect: "none",
                  }}
                >
                  Vacío
                </span>
              )}

              {img.selected && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: "#ff6b6b",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ESTILOS BOTONES (MISMO LOOK QUE PANEL MASIVO) */}
      <style jsx>{`
        .project-btn {
          border-radius: 10px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .project-btn:hover {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }

        .project-btn.danger {
          background: #ff6b6b;
          color: #ffffff;
          border-color: #ff6b6b;
        }

        .project-btn.danger:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
