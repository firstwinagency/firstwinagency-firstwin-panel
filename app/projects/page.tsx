"use client";

import { useState } from "react";

/* =========================================================
   TIPOS
========================================================= */

type ProjectImage = {
  id: string;
  src?: string;
  reference: string;
  asin?: string;
  index: number;
  selected: boolean;
};

/* =========================================================
   PAGE
========================================================= */

export default function ProjectsPage() {
  /* ---------- Estado mock (placeholder) ---------- */
  const [images, setImages] = useState<ProjectImage[]>(
    Array.from({ length: 24 }).map((_, i) => ({
      id: `img-${i}`,
      reference: "REF123",
      asin: i % 2 === 0 ? "B0TESTASIN" : undefined,
      index: i,
      selected: false,
    }))
  );

  /* ---------- Selección ---------- */
  const selectAll = () =>
    setImages((imgs) => imgs.map((i) => ({ ...i, selected: true })));

  const deselectAll = () =>
    setImages((imgs) => imgs.map((i) => ({ ...i, selected: false })));

  const toggleSelect = (id: string) =>
    setImages((imgs) =>
      imgs.map((i) =>
        i.id === id ? { ...i, selected: !i.selected } : i
      )
    );

  /* ---------- ZIP (placeholder) ---------- */
  const downloadZipReference = () => {
    console.log("ZIP por referencia");
  };

  const downloadZipAsin = () => {
    console.log("ZIP por ASIN");
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ===== LATERAL IZQUIERDO CORAL (AJUSTADO) ===== */}
      <div style={{ width: 60, background: "#ff6b6b" }} />

      {/* ===== CONTENIDO CENTRAL ===== */}
      <main
        style={{
          flex: 1,
          background: "#ffffff",
          padding: "24px 32px",
        }}
      >
        {/* ---------- TÍTULO ---------- */}
        <h1
          style={{
            textAlign: "center",
            fontFamily: "DM Serif Display",
            fontSize: 34,
            marginBottom: 16,
            color: "#111",
          }}
        >
          Proyectos
        </h1>

        {/* ---------- BOTONES ---------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <button className="btn" onClick={selectAll}>
            Seleccionar todo
          </button>
          <button className="btn" onClick={deselectAll}>
            Deseleccionar todo
          </button>
          <button className="btn dark" onClick={downloadZipReference}>
            Descargar ZIP (Referencia)
          </button>
          <button className="btn coral" onClick={downloadZipAsin}>
            Descargar ZIP (ASIN)
          </button>
        </div>

        {/* ---------- GRID (TAMAÑO RECUPERADO) ---------- */}
        <div
          style={{
            maxWidth: 1400,              // ⬅️ MÁS ANCHO (CLAVE)
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
          }}
        >
          {images.map((img) => {
            const label = img.asin
              ? `${img.reference} / ${img.asin} · ${img.index}`
              : `${img.reference} · ${img.index}`;

            return (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  borderRadius: 14,
                  background: "#f2f2f2",
                  aspectRatio: "1 / 1",
                  cursor: "pointer",
                  boxShadow: img.selected
                    ? "0 0 0 3px #ff6b6b"
                    : "0 1px 4px rgba(0,0,0,.12)",
                }}
                onClick={() => toggleSelect(img.id)}
              >
                {/* CHECK */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: img.selected ? "#ff6b6b" : "#fff",
                    border: "1px solid #ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                    color: img.selected ? "#fff" : "transparent",
                    zIndex: 2,
                  }}
                >
                  ✓
                </div>

                {/* LABEL */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "6px 8px",
                    fontSize: 11,
                    background: "rgba(0,0,0,.55)",
                    color: "#fff",
                    borderBottomLeftRadius: 14,
                    borderBottomRightRadius: 14,
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ===== LATERAL DERECHO CORAL (AJUSTADO) ===== */}
      <div style={{ width: 60, background: "#ff6b6b" }} />
    </div>
  );
}
