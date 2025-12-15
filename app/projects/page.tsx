"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";

type ProjectImage = {
  id: string;
  reference: string | null;
  asin: string | null;
  storage_path: string;
  created_at: string;
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
      .order("created_at", { ascending: false });

    if (data) setImages(data);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectAll() {
    setSelected(new Set(images.map((i) => i.id)));
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm("¿Eliminar imágenes seleccionadas?")) return;

    for (const id of selected) {
      const img = images.find((i) => i.id === id);
      if (!img) continue;

      await supabase.storage.from("project-images").remove([img.storage_path]);
      await supabase.from("project_images").delete().eq("id", id);
    }

    setSelected(new Set());
    loadImages();
  }

  async function downloadZip(useAsin: boolean) {
    const zip = new JSZip();
    let i = 1;

    for (const img of images) {
      const { data } = await supabase.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const base =
        useAsin && img.asin
          ? img.asin
          : img.reference || "image";

      zip.file(`${base}_${i}.jpg`, data);
      i++;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, useAsin ? "proyecto_asin.zip" : "proyecto_referencia.zip");
  }

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar" style={{ left: 0 }}>
        <h1 style={{ fontWeight: 700, fontSize: 18 }}>
          Proyectos · Galería
        </h1>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-zoom" onClick={() => downloadZip(false)}>
            Descargar ZIP (Referencia)
          </button>
          <button className="btn-zoom" onClick={() => downloadZip(true)}>
            Descargar ZIP (ASIN)
          </button>
          <button className="btn-zoom" onClick={selectAll}>
            Seleccionar todo
          </button>
          <button
            className="btn-zoom"
            style={{ background: "#ff6b6b", color: "#fff" }}
            onClick={deleteSelected}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <main
        style={{
          paddingTop: 80,
          paddingInline: 24,
          background: "white",
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 16,
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
                  border: selected.has(img.id)
                    ? "2px solid #ff6b6b"
                    : "1px solid #ddd",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <img
                  src={url}
                  onClick={() => setPreview(url)}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                  }}
                />

                <div style={{ padding: 8 }}>
                  <label style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(img.id)}
                      onChange={() => toggle(img.id)}
                    />{" "}
                    Seleccionar
                  </label>

                  <div style={{ fontSize: 11, color: "#555" }}>
                    {img.reference || img.asin}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* VISOR */}
      {preview && (
        <div
          className="viewer-overlay"
          onClick={() => setPreview(null)}
        >
          <img src={preview} className="viewer-image" />
        </div>
      )}
    </>
  );
}
