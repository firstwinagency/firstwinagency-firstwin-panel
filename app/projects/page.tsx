"use client";

import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";

type ProjectImage = {
  id: string;
  reference: string | null;
  asin: string | null;
  filename: string | null;
  storage_path: string;
  created_at: string;
};

const CORAL = "#ff6b6b";
const BORDER = "#e5e7eb";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getExtFromFilename(name?: string | null) {
  const m = (name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] || "jpg";
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  return "jpg";
}

function getOrderFromFilename(name?: string | null) {
  // intenta sacar el número final de: algo_12.jpg  | algo-12.png | algo 12.webp
  const base = (name || "").replace(/\.[^/.]+$/, "");
  const m = base.match(/(?:_|-|\s)(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function buildLabel(img: ProjectImage, fallbackIndex: number) {
  const order = getOrderFromFilename(img.filename) ?? fallbackIndex;
  const ref = (img.reference || "").trim();
  const asin = (img.asin || "").trim();

  if (ref && asin) return `${ref} / ${asin} · ${order}`;
  if (ref) return `${ref} · ${order}`;
  if (asin) return `${asin} · ${order}`;
  return `image · ${order}`;
}

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const { data, error } = await supabase
      .from("project_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setImages(data as ProjectImage[]);
  }

  const tiles = useMemo(() => {
    // Queremos "cuadraditos" aunque no haya imágenes.
    // Base: 30 tiles (5 filas x 6). Si hay más imágenes, crece automáticamente.
    const baseCount = 30;
    const total = Math.max(baseCount, images.length);
    const rows = Math.max(1, Math.ceil(total / 6));
    const finalTotal = rows * 6;
    return finalTotal;
  }, [images.length]);

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

  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm("¿Eliminar imágenes seleccionadas?")) return;

    const toDelete = images.filter((i) => selected.has(i.id));

    for (const img of toDelete) {
      // Storage
      await supabase.storage.from("project-images").remove([img.storage_path]);
      // DB
      await supabase.from("project_images").delete().eq("id", img.id);
    }

    clearSelection();
    loadImages();
  }

  async function downloadZip(useAsin: boolean) {
    const chosen = selected.size ? images.filter((i) => selected.has(i.id)) : images;
    if (!chosen.length) return;

    // Orden estable: por numeración si existe, si no por created_at desc
    const sorted = [...chosen].sort((a, b) => {
      const oa = getOrderFromFilename(a.filename);
      const ob = getOrderFromFilename(b.filename);
      if (oa != null && ob != null) return oa - ob;
      if (oa != null) return -1;
      if (ob != null) return 1;
      // fallback: más antiguo primero dentro del zip (para que el orden sea natural)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const zip = new JSZip();

    for (let i = 0; i < sorted.length; i++) {
      const img = sorted[i];

      const { data } = await supabase.storage.from("project-images").download(img.storage_path);
      if (!data) continue;

      const order = getOrderFromFilename(img.filename) ?? i;
      const ext = getExtFromFilename(img.filename);

      const base =
        useAsin && img.asin
          ? String(img.asin).trim()
          : String(img.reference || "image").trim();

      const safeBase = base.replace(/[\/\\:?*"<>|]+/g, "_").slice(0, 80) || "image";
      const filename = `${safeBase}_${order}.${ext}`;

      zip.file(filename, data);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, useAsin ? "proyecto_ASIN.zip" : "proyecto_referencia.zip");
  }

  return (
    <div style={{ minHeight: "100vh", background: CORAL }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .proj-shell{
              display:flex;
              min-height:100vh;
              background:${CORAL};
            }
            .proj-side{
              width:26px;
              background:${CORAL};
              flex:0 0 26px;
            }
            .proj-center{
              flex:1 1 auto;
              background:#ffffff;
              border-left:1px solid rgba(0,0,0,.06);
              border-right:1px solid rgba(0,0,0,.06);
              min-height:100vh;
            }
            .proj-top{
              background:${CORAL};
              padding:18px 18px 14px 18px;
              border-bottom:1px solid rgba(0,0,0,.08);
            }
            .proj-title{
              text-align:center;
              font-weight:900;
              color:#111;
              font-size:40px;
              letter-spacing:.02em;
              font-family: "DM Serif Display", serif;
              line-height:1.05;
              margin:10px 0 10px 0;
            }
            .proj-actions{
              display:flex;
              justify-content:center;
              gap:10px;
              flex-wrap:wrap;
              margin-bottom:10px;
            }
            .btn{
              border-radius:10px;
              padding:8px 12px;
              font-weight:800;
              cursor:pointer;
              border:1px solid ${BORDER};
              background:#fff;
              color:#111;
              transition:.15s ease;
              font-family: Inter, sans-serif;
            }
            .btn:hover{ transform: translateY(-1px); }
            .btn-primary{
              background:#000;
              color:${CORAL};
              border:1px solid rgba(0,0,0,.18);
            }
            .btn-coral{
              background:${CORAL};
              color:#111;
              border:1px solid rgba(0,0,0,.12);
            }
            .btn-danger{
              background:#fff;
              color:#b91c1c;
              border:1px solid #fecaca;
            }
            .proj-content{
              padding:18px;
            }
            .grid{
              display:grid;
              gap:14px;
              grid-template-columns: repeat(6, minmax(0, 1fr));
            }
            @media (max-width: 1400px){ .grid{ grid-template-columns: repeat(5, minmax(0, 1fr)); } }
            @media (max-width: 1200px){ .grid{ grid-template-columns: repeat(4, minmax(0, 1fr)); } }
            @media (max-width: 900px){ .grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
            @media (max-width: 640px){ .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }

            .tile{
              position:relative;
              border-radius:18px;
              border:1px solid ${BORDER};
              background:#fff;
              overflow:hidden;
              box-shadow: 0 10px 24px rgba(0,0,0,.12);
              aspect-ratio: 1 / 1;
            }
            .tile-inner{
              position:absolute; inset:0;
              display:flex; align-items:center; justify-content:center;
              background: #fff;
            }
            .tile-img{
              width:100%;
              height:100%;
              object-fit:cover;
              display:block;
              cursor: zoom-in;
            }
            .tile-empty{
              width:100%;
              height:100%;
              background: rgba(0,0,0,0.03);
            }
            .check{
              position:absolute;
              top:10px;
              left:10px;
              background:#fff;
              border:1px solid ${BORDER};
              border-radius:10px;
              padding:6px 8px;
              display:flex;
              align-items:center;
              gap:6px;
              z-index:2;
              user-select:none;
            }
            .label{
              position:absolute;
              left:10px;
              right:10px;
              bottom:10px;
              background: rgba(0,0,0,.74);
              color:#fff;
              border-radius:12px;
              padding:8px 10px;
              font-size:12px;
              font-weight:800;
              display:flex;
              align-items:center;
              justify-content:center;
              text-align:center;
              z-index:2;
              backdrop-filter: blur(6px);
            }
            .selected-ring{
              outline: 3px solid ${CORAL};
              outline-offset: -3px;
            }

            .viewer{
              position:fixed;
              inset:0;
              background: rgba(0,0,0,.78);
              display:flex;
              align-items:center;
              justify-content:center;
              z-index:999999;
              padding:18px;
              cursor: zoom-out;
            }
            .viewer img{
              max-width: 92vw;
              max-height: 92vh;
              border-radius: 14px;
              box-shadow: 0 20px 60px rgba(0,0,0,.55);
              cursor: default;
            }
          `,
        }}
      />

      <div className="proj-shell">
        <div className="proj-side" />
        <div className="proj-center">
          {/* TOP */}
          <div className="proj-top">
            <div className="proj-title">Proyectos</div>

            <div className="proj-actions">
              <button className="btn" onClick={selectAll}>
                Seleccionar todo
              </button>
              <button className="btn" onClick={clearSelection}>
                Deseleccionar todo
              </button>

              <button className="btn btn-primary" onClick={() => downloadZip(false)}>
                Descargar ZIP (Referencia)
              </button>
              <button className="btn btn-coral" onClick={() => downloadZip(true)}>
                Descargar ZIP (ASIN)
              </button>

              <button className="btn btn-danger" onClick={deleteSelected}>
                Eliminar
              </button>
            </div>
          </div>

          {/* GRID */}
          <div className="proj-content">
            <div className="grid">
              {Array.from({ length: tiles }).map((_, idx) => {
                const img = images[idx];

                if (!img) {
                  return (
                    <div key={`empty-${idx}`} className="tile">
                      <div className="tile-inner">
                        <div className="tile-empty" />
                      </div>
                    </div>
                  );
                }

                const isSel = selected.has(img.id);

                const publicUrl = supabase.storage
                  .from("project-images")
                  .getPublicUrl(img.storage_path).data.publicUrl;

                const label = buildLabel(img, idx);

                return (
                  <div key={img.id} className={`tile ${isSel ? "selected-ring" : ""}`}>
                    <div className="check" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(img.id)}
                      />
                      <span style={{ fontSize: 12, fontWeight: 800 }}>seleccionar</span>
                    </div>

                    <div className="tile-inner">
                      <img
                        src={publicUrl}
                        className="tile-img"
                        onClick={() => setPreview(publicUrl)}
                        alt={label}
                      />
                    </div>

                    <div className="label">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="proj-side" />
      </div>

      {/* LIGHTBOX */}
      {preview && (
        <div className="viewer" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
