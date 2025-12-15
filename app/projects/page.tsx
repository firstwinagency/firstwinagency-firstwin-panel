"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ProjectImage = {
  id: string;
  src: string;
  reference: string;
  asin?: string;
  order: number;
  selected: boolean;
};

const INITIAL_SLOTS = 18; // 3 filas * 6 columnas

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [viewer, setViewer] = useState<ProjectImage | null>(null);

  /* =========================
     GRID DINÁMICO
     ========================= */
  const slots = useMemo(() => {
    const minSlots =
      images.length <= INITIAL_SLOTS
        ? INITIAL_SLOTS
        : Math.ceil(images.length / 6) * 6;

    return Array.from({ length: minSlots });
  }, [images.length]);

  /* =========================
     SELECCIÓN
     ========================= */
  const selectAll = () =>
    setImages((prev) => prev.map((i) => ({ ...i, selected: true })));

  const deselectAll = () =>
    setImages((prev) => prev.map((i) => ({ ...i, selected: false })));

  const toggleSelect = (id: string) =>
    setImages((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, selected: !i.selected } : i
      )
    );

  /* =========================
     ZIP
     ========================= */
  const downloadZip = async (mode: "reference" | "asin") => {
    const zip = new JSZip();
    let count = 0;

    images
      .filter((i) => i.selected)
      .forEach((img) => {
        const base =
          mode === "asin" && img.asin
            ? img.asin
            : img.reference;

        const filename = `${base}_${img.order}.jpg`;
        zip.file(filename, img.src.split(",")[1], { base64: true });
        count++;
      });

    if (!count) {
      alert("No hay imágenes seleccionadas");
      return;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `proyecto_${mode}.zip`);
  };

  /* =========================
     UI
     ========================= */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ff6b6b",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          background: "#ffffff",
          minHeight: "100vh",
          padding: "24px 24px 40px",
        }}
      >
        {/* TÍTULO */}
        <h1
          style={{
            textAlign: "center",
            fontFamily: "DM Serif Display",
            fontSize: 36,
            color: "#000",
            marginBottom: 18,
          }}
        >
          Proyectos
        </h1>

        {/* BOTONERA */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 26,
          }}
        >
          <Btn onClick={selectAll}>Seleccionar todo</Btn>
          <Btn onClick={deselectAll}>Deseleccionar todo</Btn>
          <Btn dark onClick={() => downloadZip("reference")}>
            Descargar ZIP (Referencia)
          </Btn>
          <Btn accent onClick={() => downloadZip("asin")}>
            Descargar ZIP (ASIN)
          </Btn>
        </div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
          }}
        >
          {slots.map((_, idx) => {
            const img = images[idx];

            if (!img) {
              return (
                <div
                  key={idx}
                  style={{
                    aspectRatio: "1 / 1",
                    background: "#f3f3f3",
                    borderRadius: 16,
                    boxShadow: "0 4px 10px rgba(0,0,0,.08)",
                  }}
                />
              );
            }

            return (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 6px 16px rgba(0,0,0,.15)",
                  cursor: "pointer",
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
                    zIndex: 3,
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: img.selected ? "#ff6b6b" : "#ffffff",
                    border: "1px solid #ddd",
                    color: img.selected ? "#fff" : "#999",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>

                {/* IMG */}
                <img
                  src={img.src}
                  alt=""
                  onClick={() => setViewer(img)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* FOOTER INFO */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "6px 8px",
                    background: "rgba(0,0,0,.65)",
                    color: "#fff",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {img.asin
                    ? `${img.reference} / ${img.asin} · ${img.order}`
                    : `${img.reference} · ${img.order}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VISOR */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={viewer.src}
            alt=""
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(0,0,0,.5)",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* =========================
   BOTÓN REUTILIZABLE
   ========================= */
function Btn({
  children,
  onClick,
  dark,
  accent,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  dark?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: accent
          ? "#ff6b6b"
          : dark
          ? "#000"
          : "#fff",
        color: accent ? "#fff" : dark ? "#ff6b6b" : "#111",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
