"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";

type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  filename: string;
  mime: string;
  storage_path: string;
  created_at: string;
};

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  /* =========================
     LOAD PROJECT IMAGES
  ========================= */
  const loadImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_images")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) setImages(data);
    setLoading(false);
  };

  useEffect(() => {
    loadImages();
  }, []);

  /* =========================
     SELECTION
  ========================= */
  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    setSelected(new Set(images.map((i) => i.id)));
  };

  const clearSelection = () => setSelected(new Set());

  /* =========================
     DELETE
  ========================= */
  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm("¿Eliminar imágenes seleccionadas?")) return;

    const toDelete = images.filter((i) => selected.has(i.id));

    for (const img of toDelete) {
      await supabase.storage.from("project-images").remove([img.storage_path]);
      await supabase.from("project_images").delete().eq("id", img.id);
    }

    clearSelection();
    loadImages();
  };

  /* =========================
     DOWNLOAD ZIP
  ========================= */
  const downloadZip = async (mode: "reference" | "asin") => {
    const zip = new JSZip();
    const items = images.filter((i) => selected.has(i.id));

    if (!items.length) {
      alert("Selecciona imágenes");
      return;
    }

    let index = 0;

    for (const img of items) {
      const { data } = await supabase.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const base =
        mode === "asin"
          ? img.asin || "SIN_ASIN"
          : img.reference || "SIN_REF";

      const ext =
        img.mime.includes("png")
          ? "png"
          : img.mime.includes("webp")
          ? "webp"
          : "jpg";

      zip.file(${base}_${index}.${ext}, data);
      index++;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, proyecto_${mode}.zip);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={{ padding: 32, maxWidth: 1300, margin: "0 auto" }}>
      <h1 style={{ fontWeight: 800, color: "var(--brand-accent)" }}>
        Proyectos · Galería
      </h1>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        <button onClick={selectAll} className="btn">
          Seleccionar todo
        </button>

        <button onClick={clearSelection} className="btn">
          Limpiar selección
        </button>

        <button onClick={deleteSelected} className="btn danger">
          Eliminar
        </button>

        <button
          onClick={() => downloadZip("reference")}
          className="btn primary"
        >
          Descargar ZIP (Referencia)
        </button>

        <button
          onClick={() => downloadZip("asin")}
          className="btn primary"
        >
          Descargar ZIP (ASIN)
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
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
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                  position: "relative",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(img.id)}
                  onChange={() => toggle(img.id)}
                  style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}
                />

                <img
                  src={publicUrl}
                  onClick={() => setLightbox(publicUrl)}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    cursor: "zoom-in",
                  }}
                />

                <div style={{ padding: 8, fontSize: 12 }}>
                  <div>
                    <strong>Ref:</strong> {img.reference || "-"}
                  </div>
                  <div>
                    <strong>ASIN:</strong> {img.asin || "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={lightbox}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
            }}
          />
        </div>
      )}

      {/* BASIC STYLES */}
      <style>{`
        .btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn.primary {
          background: var(--brand-accent);
          color: var(--brand-accent-ink);
        }
        .btn.danger {
          background: #fee2e2;
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
}
