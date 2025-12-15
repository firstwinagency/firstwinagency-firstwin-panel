"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";

type ProjectImage = {
  id: string;
  reference: string | null;
  asin: string | null;
  order_index: number;
  storage_path: string;
};

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const { data } = await supabase
      .from("project_images")
      .select("*")
      .order("order_index", { ascending: true });

    if (data) setImages(data);
  }

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

  async function downloadZip(mode: "reference" | "asin") {
    const zip = new JSZip();
    const imgs = images.filter((i) => selected.has(i.id));

    for (const img of imgs) {
      const { data } = await supabase.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const base =
        mode === "asin" && img.asin
          ? img.asin
          : img.reference ?? "image";

      const filename = `${base}-${img.order_index}.jpg`;
      zip.file(filename, data);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `proyecto_${mode}.zip`);
  }

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto", // ✅ SCROLL AÑADIDO
      }}
    >
      <div style={{ display: "flex" }}>
        {/* MARGEN IZQUIERDO */}
        <div style={{ width: 40, background: "#ff6d6d" }} />

        {/* CONTENIDO */}
        <div style={{ flex: 1, padding: "40px 32px" }}>
          <h1
            style={{
              fontFamily: "DM Serif Display",
              fontSize: 32,
              textAlign: "center",
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
              gap: 12,
              marginBottom: 30,
              flexWrap: "wrap",
            }}
          >
            <button onClick={selectAll} className="btn-zoom">
              Seleccionar todo
            </button>

            <button onClick={deselectAll} className="btn-zoom">
              Deseleccionar todo
            </button>

            <button
              onClick={() => downloadZip("reference")}
              className="btn-zoom"
              style={{ background: "#000", color: "#fff" }}
            >
              Descargar ZIP (Referencia)
            </button>

            <button
              onClick={() => downloadZip("asin")}
              className="btn-zoom"
              style={{ background: "#ff6d6d", color: "#fff" }}
            >
              Descargar ZIP (ASIN)
            </button>
          </div>

          {/* GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 20,
            }}
          >
            {images.map((img) => {
              const url = supabase.storage
                .from("project-images")
                .getPublicUrl(img.storage_path).data.publicUrl;

              return (
                <div
                  key={img.id}
                  style={{
                    background: "#f3f3f3",
                    borderRadius: 16,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {/* CHECK */}
                  <input
                    type="checkbox"
                    checked={selected.has(img.id)}
                    onChange={() => toggleSelect(img.id)}
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      zIndex: 2,
                    }}
                  />

                  {/* IMAGEN */}
                  <img
                    src={url}
                    onClick={() => setPreview(url)}
                    style={{
                      width: "100%",
                      height: 220,
                      objectFit: "cover",
                    }}
                  />

                  {/* FOOTER (VACÍO HASTA DATOS REALES) */}
                  <div
                    style={{
                      height: 32,
                      background: "#6b6b6b",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* MARGEN DERECHO */}
        <div style={{ width: 40, background: "#ff6d6d" }} />
      </div>

      {/* PREVIEW */}
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
          <img
            src={preview}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 12,
            }}
          />
        </div>
      )}
    </div>
  );
}
