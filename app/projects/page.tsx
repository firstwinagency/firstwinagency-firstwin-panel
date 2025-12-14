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

  /* ======================
     CARGAR IMÁGENES
     ====================== */
  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const { data, error } = await supabase
      .from("project_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setImages(data);
  }

  /* ======================
     SELECCIÓN
     ====================== */
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

  function clearSelection() {
    setSelected(new Set());
  }

  /* ======================
     ELIMINAR
     ====================== */
  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm("¿Eliminar imágenes seleccionadas?")) return;

    const toDelete = images.filter((i) => selected.has(i.id));

    for (const img of toDelete) {
      await supabase.storage
        .from("project-images")
        .remove([img.storage_path]);

      await supabase.from("project_images").delete().eq("id", img.id);
    }

    clearSelection();
    loadImages();
  }

  /* ======================
     DESCARGAR ZIP
     ====================== */
  async function downloadZip(useAsin: boolean) {
    if (!images.length) return;

    const zip = new JSZip();
    let index = 0;

    for (const img of images) {
      const { data } = await supabase.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const base =
        useAsin && img.asin
          ? img.asin
          : img.reference || "image";

      // ✅ TEMPLATE STRING CORRECTA (ESTO ERA TODO EL PROBLEMA)
      zip.file(`${base}_${index}.jpg`, data);
      index++;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(
      blob,
      useAsin ? "proyecto_asin.zip" : "proyecto_referencia.zip"
    );
  }

  /* ======================
     UI
     ====================== */
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, marginBottom: 12 }}>
        Proyectos · Galería
      </h1>

      {/* BOTONES */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => downloadZip(false)} className="btn-primary">
          Descargar ZIP (Referencia)
        </button>
        <button onClick={() => downloadZip(true)} className="btn-primary">
          Descargar ZIP (ASIN)
        </button>
        <button onClick={selectAll} className="btn-ghost">
          Seleccionar todo
        </button>
        <button onClick={deleteSelected} className="btn-danger">
          Eliminar seleccionadas
        </button>
      </div>

      {/* GALERÍA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
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
                border: selected.has(img.id)
                  ? "2px solid var(--brand-accent)"
                  : "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <img
                src={publicUrl}
                style={{ width: "100%", height: 160, objectFit: "cover", cursor: "pointer" }}
                onClick={() => setPreview(publicUrl)}
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
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {img.reference || img.asin}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VISOR */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
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
            src={preview}
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 12 }}
          />
        </div>
      )}
    </div>
  );
}

