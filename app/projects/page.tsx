"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ProjectImage = {
  id: string;
  url: string;
  reference?: string;
  asin?: string;
  index: number;
};

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ProjectImage | null>(null);

  /* ======================
     MOCK (sustituido luego por Supabase)
     ====================== */
  useEffect(() => {
    const mock: ProjectImage[] = Array.from({ length: 24 }).map((_, i) => ({
      id: `img-${i}`,
      url: "",
      reference: "REF123",
      asin: i % 2 === 0 ? "B0TESTASIN" : undefined,
      index: i,
    }));
    setImages(mock);
  }, []);

  /* ======================
     Selección
     ====================== */
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(images.map((i) => i.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  /* ======================
     Descargar ZIP
     ====================== */
  async function downloadZip(type: "reference" | "asin") {
    const zip = new JSZip();
    let count = 0;

    images.forEach((img) => {
      if (!selected.has(img.id)) return;

      const base =
        type === "asin" && img.asin
          ? img.asin
          : img.reference ?? "IMAGE";

      const filename = `${base}-${img.index}.jpg`;
      zip.file(filename, ""); // aquí irá el blob real
      count++;
    });

    if (!count) return;

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `proyecto_${type}.zip`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        padding: "0 32px", // 🔧 MÁRGENES CORAL MÁS ESTRECHOS (ANTES)
      }}
    >
      {/* TÍTULO */}
      <h1
        style={{
          fontFamily: "DM Serif Display",
          fontSize: 34,
          textAlign: "center",
          marginTop: 30,
          marginBottom: 20,
        }}
      >
        Proyectos
      </h1>

      {/* BOTONES */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
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
          style={{ background: "#000", color: "#fff" }}
          onClick={() => downloadZip("reference")}
        >
          Descargar ZIP (Referencia)
        </button>

        <button
          className="btn-zoom"
          style={{ background: "#ff6d6d", color: "#fff" }}
          onClick={() => downloadZip("asin")}
        >
          Descargar ZIP (ASIN)
        </button>
      </div>

      {/* GRID */}
      <div
        style={{
          maxWidth: 1280, // 🔧 MISMO ANCHO QUE ANTES (CUADRADOS GRANDES)
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 18,
          paddingBottom: 60,
        }}
      >
        {images.map((img) => {
          const isSelected = selected.has(img.id);

          return (
            <div
              key={img.id}
              style={{
                background: "#f2f2f2",
                borderRadius: 14,
                height: 220,
                position: "relative",
                cursor: "pointer",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(255,109,109,0.6)"
                  : "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              {/* CHECK */}
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
                  background: "#fff",
                  border: "1px solid #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isSelected && "✓"}
              </div>

              {/* PREVIEW */}
              <div
                onClick={() => setPreview(img)}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              ></div>

              {/* FOOTER */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontSize: 12,
                  padding: "6px 8px",
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  textAlign: "center",
                }}
              >
                {img.reference}
                {img.asin && ` / ${img.asin}`} · {img.index}
              </div>
            </div>
          );
        })}
      </div>

      {/* PREVIEW OVERLAY */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
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
          <div
            style={{
              width: "80%",
              height: "80%",
              background: "#fff",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </div>
  );
}
