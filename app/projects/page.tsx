"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";

type ProjectImage = {
  id: string;
  reference: string | null;
  asin: string | null;
  filename: string;
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
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(images.map((i) => i.id)));
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm("¿Eliminar imágenes seleccionadas?")) return;

    for (const img of images.filter((i) => selected.has(i.id))) {
      await supabase.storage
        .from("project-images")
        .remove([img.storage_path]);

      await supabase.from("project_images").delete().eq("id", img.id);
    }

    setSelected(new Set());
    loadImages();
  }

  async function downloadZip(useAsin: boolean) {
    const zip = new JSZip();
    let index = 1;

    for (const img of images) {
      const { data } = await supabase.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const base =
        useAsin && img.asin
          ? img.asin
          : img.reference || "image";

      zip.file(`${base}_${index}.jpg`, data);
      index++;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(
      blob,
      useAsin ? "proyecto_asin.zip" : "proyecto_referencia.zip"
    );
  }

  return (
    <>
      {/* TOP BAR (MISMO ESTILO QUE PICTULAB) */}
      <div className="topbar">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-zoom" onClick={() => downloadZip(false)}>
            Descargar ZIP · Referencia
          </button>
          <button className="btn-zoom" onClick={() => downloadZip(true)}>
            Descargar ZIP · ASIN
          </button>
          <button className="btn-zoom" onClick={selectAll}>
            Seleccionar todo
          </button>
          <button
            className="btn-zoom"
            style={{ background: "#ff6d6d", color: "#fff", borderColor: "#ff6d6d" }}
            onClick={deleteSelected}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <main style={{ paddingTop: 80, paddingInline: 24 }}>
        <h1 style={{ fontWeight: 800, marginBottom: 16 }}>
          Proyectos · Galería
        </h1>

        {/* GALERÍA */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {images.map((img) => {
            const publicUrl = supabase.storage
              .from("project-images")
              .getPublicUrl(img.storage_path).data.publicUrl;

            return (
              <div
                key={img.id}
                style={{
                  background: "white",
                  borderRadius: 14,
                  border: selected.has(img.id)
                    ? "2px solid #ff6d6d"
                    : "1px solid #ddd",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(0,0,0,.12)",
                }}
              >
                <img
                  src={publicUrl}
                  onClick={() => setPreview(publicUrl)}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    cursor: "zoom-in",
                  }}
                />

                <div style={{ padding: 10 }}>
                  <label style={{ fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(img.id)}
                      onChange={() => toggle(img.id)}
                    />{" "}
                    Seleccionar
                  </label>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#666",
                      marginTop: 4,
                    }}
                  >
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

