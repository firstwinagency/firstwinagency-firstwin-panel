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

function extractOrderFromFilename(name?: string | null): number | null {
  if (!name) return null;
  // Busca ..._12.jpg / ...-12.png / ... 12.webp etc.
  const base = name.split("?")[0];
  const noExt = base.replace(/\.[^/.]+$/, "");
  const m = noExt.match(/(?:_|-|\s)(\d{1,5})$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function getLabel(img: ProjectImage) {
  // Si no hay imagen real (slot vacío) no mostramos nada
  const ref = (img.reference || "").trim();
  const asin = (img.asin || "").trim();
  const order = extractOrderFromFilename(img.filename) ?? null;

  // Si no tenemos nada aún, no pintamos placeholder falso
  if (!ref && !asin && order === null) return "";

  const base =
    ref && asin ? `${ref} / ${asin}` : ref ? ref : asin ? asin : "—";
  const num = order !== null ? order : "";
  return num !== "" ? `${base} · ${num}` : base;
}

export default function ProjectsPage() {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);

  // Slots visibles (para que haya siempre “cuadraditos” aunque no haya imágenes)
  const [minSlots] = useState<number>(24); // como antes: varias filas (6 por fila)

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

  const slots = useMemo(() => {
    const arr: (ProjectImage | null)[] = [...images];
    const needed = Math.max(minSlots, images.length);
    while (arr.length < needed) arr.push(null);
    return arr;
  }, [images, minSlots]);

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
      await supabase.storage.from("project-images").remove([img.storage_path]);
      await supabase.from("project_images").delete().eq("id", img.id);
    }

    clearSelection();
    loadImages();
  }

  async function downloadZip(useAsin: boolean) {
    const picked = images.filter((i) => selected.has(i.id));
    if (!picked.length) {
      alert("No has seleccionado ninguna imagen.");
      return;
    }

    const zip = new JSZip();

    for (const img of picked) {
      const { data } = await supabase.storage
        .from("project-images")
        .download(img.storage_path);

      if (!data) continue;

      const order = extractOrderFromFilename(img.filename) ?? 0;

      const base =
        useAsin && img.asin
          ? img.asin
          : (img.reference || img.asin || "image");

      // Mantener numeración (la que venga del panel masivo) si está en filename
      const safeBase = String(base).trim() || "image";
      const ext = (img.filename || "").toLowerCase().includes(".png")
        ? "png"
        : (img.filename || "").toLowerCase().includes(".webp")
        ? "webp"
        : (img.filename || "").toLowerCase().includes(".bmp")
        ? "bmp"
        : "jpg";

      zip.file(`${safeBase}_${order}.${ext}`, data);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, useAsin ? "proyecto_asin.zip" : "proyecto_referencia.zip");
  }

  return (
    <div className="projects-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
:root{
  --brand-accent:#ff6d6d;
  --brand-accent-ink:#15181c;
}

.projects-shell{
  position: fixed;
  inset: 0;
  background: transparent;
}

/* ✅ CONTENEDOR SCROLL (sin tocar el body overflow:hidden del global) */
.projects-scroll{
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Scrollbar visible (derecha) */
.projects-scroll::-webkit-scrollbar{ width: 10px; }
.projects-scroll::-webkit-scrollbar-thumb{
  background: rgba(0,0,0,.25);
  border-radius: 12px;
  border: 2px solid rgba(255,255,255,.6);
}
.projects-scroll::-webkit-scrollbar-track{ background: transparent; }

.projects-row{
  display: grid;
  grid-template-columns: 14px 1fr 14px; /* ✅ márgenes coral FINITOS */
  min-height: 100vh;
}

.side-coral{
  background: var(--brand-accent);
}

.center{
  background: #ffffff;
}

.center-inner{
  max-width: 1400px;
  margin: 0 auto;
  padding: 34px 26px 56px;
}

/* Título */
.h1{
  font-family: "DM Serif Display", serif;
  font-size: 40px;
  font-weight: 400;
  text-align: center;
  color: #111;
  margin: 0 0 12px 0;
}

/* Barra botones (como masivo) */
.actions{
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.btn{
  border-radius: 999px;              /* ✅ redondeados */
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  font-weight: 800;
  cursor: pointer;
  font-size: 12px;
}

.btn:hover{ border-color: rgba(0,0,0,.35); }

.btn-dark{
  background: #000;
  color: var(--brand-accent);
  border: 1px solid rgba(0,0,0,.1);
}

.btn-coral{
  background: var(--brand-accent);
  color: #fff;
  border: 1px solid rgba(0,0,0,.08);
}

.btn-live{ /* ✅ “Seleccionar todo” más vivo */
  background: #10b981;
  color: #fff;
  border: 1px solid rgba(0,0,0,.08);
}

.btn:disabled{
  opacity: .55;
  cursor: not-allowed;
}

/* Grid 6 por fila */
.grid{
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

/* Cuadradito (más grande, acercándose a márgenes) */
.card{
  position: relative;
  border-radius: 16px;
  background: #f3f4f6;
  box-shadow: 0 10px 22px rgba(0,0,0,.08);
  overflow: hidden;
  height: 250px; /* ✅ tamaño similar al “de antes” */
  border: 1px solid rgba(0,0,0,.06);
}

.card.empty{
  background: #f1f1f1;
}

.card.selected{
  outline: 3px solid rgba(255,109,109,.55);
  outline-offset: 2px;
}

.img{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
}

/* Tick (top-left) */
.tick{
  position: absolute;
  top: 10px;
  left: 10px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.tick input{
  width: 14px;
  height: 14px;
  cursor: pointer;
}

/* Banda inferior (solo texto real cuando exista) */
.band{
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 34px;
  background: rgba(55,55,55,.85);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .02em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  text-align: center;
  z-index: 2;
}

.band:empty{ display:none; }

/* Lightbox */
.lightbox{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 18px;
}
.lightbox img{
  max-width: 92vw;
  max-height: 92vh;
  border-radius: 14px;
  box-shadow: 0 20px 70px rgba(0,0,0,.55);
}
@media (max-width: 1300px){
  .grid{ grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 900px){
  .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
          `,
        }}
      />

      <div className="projects-scroll">
        <div className="projects-row">
          <div className="side-coral" />
          <div className="center">
            <div className="center-inner">
              <h1 className="h1">Proyectos</h1>

              <div className="actions">
                <button className="btn btn-live" onClick={selectAll} disabled={!images.length}>
                  Seleccionar todo
                </button>

                <button className="btn" onClick={clearSelection} disabled={!selected.size}>
                  Deseleccionar todo
                </button>

                <button
                  className="btn btn-dark"
                  onClick={() => downloadZip(false)}
                  disabled={!selected.size}
                >
                  Descargar ZIP (Referencia)
                </button>

                <button
                  className="btn btn-coral"
                  onClick={() => downloadZip(true)}
                  disabled={!selected.size}
                >
                  Descargar ZIP (ASIN)
                </button>

                <button
                  className="btn"
                  onClick={deleteSelected}
                  disabled={!selected.size}
                  style={{
                    background: "#ffefef",
                    borderColor: "#fecaca",
                    color: "#b91c1c",
                  }}
                >
                  Eliminar
                </button>
              </div>

              <div className="grid">
                {slots.map((img, idx) => {
                  const isEmpty = !img;
                  const isSel = img ? selected.has(img.id) : false;

                  const publicUrl = img
                    ? supabase.storage
                        .from("project-images")
                        .getPublicUrl(img.storage_path).data.publicUrl
                    : null;

                  const label = img ? getLabel(img) : "";

                  return (
                    <div
                      key={img ? img.id : `empty-${idx}`}
                      className={`card ${isEmpty ? "empty" : ""} ${isSel ? "selected" : ""}`}
                    >
                      {/* tick */}
                      {!isEmpty && img && (
                        <div className="tick" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggle(img.id)}
                            aria-label="Seleccionar imagen"
                          />
                        </div>
                      )}

                      {/* imagen */}
                      {!isEmpty && publicUrl ? (
                        <img
                          src={publicUrl}
                          className="img"
                          onClick={() => setPreview(publicUrl)}
                          draggable={false}
                        />
                      ) : null}

                      {/* banda inferior: solo si hay label real */}
                      {!isEmpty && <div className="band">{label}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="side-coral" />
        </div>
      </div>

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

