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
  const [selected, setSelected] = useState<string[]>([]);
  const [viewer, setViewer] = useState<ProjectImage | null>(null);
  const [order, setOrder] = useState<"new" | "old">("new");

  useEffect(() => {
    fetchImages();
  }, [order]);

  async function fetchImages() {
    const { data, error } = await supabase
      .from("project_images")
      .select("*")
      .order("created_at", { ascending: order === "old" });

    if (!error && data) setImages(data);
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function downloadZip(type: "reference" | "asin") {
    const zip = new JSZip();
    let index = 1;

    for (const img of images.filter((i) => selected.includes(i.id))) {
      const { data } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS!)
        .download(img.storage_path);

      if (!data) continue;

      const base =
        type === "asin"
          ? img.asin || "image"
          : img.reference || "image";

      const buffer = await data.arrayBuffer();
      zip.file(${base}_${index}.jpg, buffer);
      index++;
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, project_${type}.zip);
  }

  async function deleteSelected() {
    for (const img of images.filter((i) => selected.includes(i.id))) {
      await supabase
        .from("project_images")
        .delete()
        .eq("id", img.id);

      await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS!)
        .remove([img.storage_path]);
    }

    setSelected([]);
    fetchImages();
  }

  return (
    <div style={{ padding: 32, color: "#fff" }}>
      <h1 style={{ color: "#FF6D6D", fontSize: 32, marginBottom: 20 }}>
        Proyectos
      </h1>

      {/* CONTROLES */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button onClick={() => downloadZip("reference")} className="btn-red">
          Descargar ZIP (Referencia)
        </button>
        <button onClick={() => downloadZip("asin")} className="btn-red">
          Descargar ZIP (ASIN)
        </button>
        <button onClick={deleteSelected} className="btn-black">
          Eliminar seleccionadas
        </button>
        <button
          onClick={() => setOrder(order === "new" ? "old" : "new")}
          className="btn-white"
        >
          Orden: {order === "new" ? "Recientes" : "Antiguas"}
        </button>
      </div>

      {/* GALERÍA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {images.map((img) => (
          <div
            key={img.id}
            style={{
              border: selected.includes(img.id)
                ? "3px solid #00c851"
                : "1px solid #333",
              borderRadius: 12,
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            <img
              src={${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS}/${img.storage_path}}
              style={{ width: "100%", height: 200, objectFit: "cover" }}
              onClick={() => setViewer(img)}
            />
            <div style={{ padding: 10 }}>
              <input
                type="checkbox"
                checked={selected.includes(img.id)}
                onChange={() => toggleSelect(img.id)}
              />{" "}
              {img.reference || img.asin || "Imagen"}
            </div>
          </div>
        ))}
      </div>

      {/* VISOR */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS}/${viewer.storage_path}}
            style={{ maxWidth: "90%", maxHeight: "90%" }}
          />
        </div>
      )}
    </div>
  );
}
