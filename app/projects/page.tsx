"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ProjectImage = {
  id: string;
  src: string;          // base64 o URL
  reference: string;
  asin?: string;
  index: number;        // numeración heredada del panel masivo
};

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<ProjectImage | null>(null);

  /* =====================
     Helpers
  ====================== */

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deselectAll = () => setSelected(new Set());

  const downloadZip = async (mode: "reference" | "asin") => {
    if (selected.size === 0) {
      alert("Selecciona al menos una imagen");
      return;
    }

    const zip = new JSZip();

    images
      .filter(img => selected.has(img.id))
      .forEach(img => {
        const base =
          mode === "asin" && img.asin
            ? img.asin
            : img.reference;

        const filename = `${base}_${img.index}.jpg`;
        const base64 = img.src.split(",")[1];

        zip.file(filename, base64, { base64: true });
      });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `proyecto_${mode}.zip`);
  };

  /* =====================
     UI
  ====================== */

  return (
    <div style={{ padding: "80px 32px" }}>

      {/* TOP BAR */}
      <div className="topbar" style={{ left: 0 }}>
        <h1 style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontWeight: 800,
          color: "#15181c"
        }}>
          Proyectos
        </h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-zoom" onClick={deselectAll}>
            Deseleccionar todo
          </button>
          <button className="btn-zoom" onClick={() => downloadZip("reference")}>
            Descargar ZIP Referencia
          </button>
          <button
            className="btn-zoom"
            style={{ background: "#ff6b6b", color: "#fff" }}
            onClick={() => downloadZip("asin")}
          >
            Descargar ZIP ASIN
          </button>
        </div>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 16,
          marginTop: 40,
        }}
      >
        {images.map(img => {
          const label = img.asin
            ? `${img.reference} / ${img.asin} · ${img.index}`
            : `${img.reference} · ${img.index}`;

          const isSelected = selected.has(img.id);

          return (
            <div
              key={img.id}
              onClick={() => toggleSelect(img.id)}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 14,
                overflow: "hidden",
                cursor: "pointer",
                border: isSelected
                  ? "3px solid #ff6b6b"
                  : "1px solid #e5e7eb",
                background: "#f3f4f6",
              }}
            >
              <img
                src={img.src}
                alt=""
                onClick={(e) => {
                  e.stopPropagation();
                  setViewer(img);
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* LABEL */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "rgba(0,0,0,0.65)",
                  color: "#fff",
                  fontSize: 12,
                  padding: "6px 8px",
                  textAlign: "center",
                }}
              >
                {label}
              </div>
            </div>
          );
        })}

        {/* Placeholders */}
        {images.length < 12 &&
          Array.from({ length: 12 - images.length }).map((_, i) => (
            <div
              key={`ph-${i}`}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 14,
                border: "1px dashed #d1d5db",
                background: "#ffffff",
              }}
            />
          ))}
      </div>

      {/* LIGHTBOX */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={viewer.src}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 16,
            }}
          />
        </div>
      )}
    </div>
  );
}
