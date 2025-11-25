"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {

  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [format, setFormat] = useState("JPG");

  const containerRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     LISTA DE TAMAÑOS COMPLETA
  ============================================================ */
  const sizes = [
    { label: "1:1 (cuadrado)", type: "(cuadrado)", size: "1024×1024", ratio: 1 },
    { label: "2:2 (cuadrado)", type: "(cuadrado)", size: "2000×2000", ratio: 1 },

    { label: "2:3 (vertical)", type: "(vertical)", size: "832×1248", ratio: 0.66 },
    { label: "3:4 (vertical)", type: "(vertical)", size: "864×1184", ratio: 0.73 },
    { label: "4:5 (vertical)", type: "(vertical)", size: "896×1152", ratio: 0.78 },
    { label: "9:16 (vertical)", type: "(vertical)", size: "768×1344", ratio: 0.56 },
    { label: "21:9 (vertical)", type: "(vertical)", size: "672×1536", ratio: 0.43 },

    { label: "3:2 (horizontal)", type: "(horizontal)", size: "1248×832", ratio: 1.5 },
    { label: "4:3 (horizontal)", type: "(horizontal)", size: "1184×864", ratio: 1.37 },
    { label: "5:4 (horizontal)", type: "(horizontal)", size: "1152×896", ratio: 1.28 },
    { label: "16:9 (horizontal)", type: "(horizontal)", size: "1344×768", ratio: 1.77 },
    { label: "21:9 (horizontal)", type: "(horizontal)", size: "1536×672", ratio: 2.28 },

    { label: "A5 vertical", type: "(vertical)", size: "1748×2480", ratio: 0.70 },
    { label: "A5 horizontal", type: "(horizontal)", size: "2480×1748", ratio: 1.42 },
    { label: "A4 vertical", type: "(vertical)", size: "2480×3508", ratio: 0.70 },
    { label: "A4 horizontal", type: "(horizontal)", size: "3508×2480", ratio: 1.41 },
    { label: "A3 vertical", type: "(vertical)", size: "3508×4961", ratio: 0.70 },
    { label: "A3 horizontal", type: "(horizontal)", size: "4961×3508", ratio: 1.41 },
  ];

  const selected = sizes.find(s => s.label === selectedSize);
  const ratio = selected?.ratio ?? 1;

  /* ============================================================
     CÁLCULO DEL LIENZO (FIX DEFINITIVO)
  ============================================================ */
  const [previewDims, setPreviewDims] = useState({ w: 300, h: 300 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const maxW = containerRef.current.clientWidth * 0.75;
      const maxH = containerRef.current.clientHeight * 0.75;

      let w = maxW;
      let h = w / ratio;

      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }

      setPreviewDims({ w, h });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ratio]);

  /* ============================================================
     SUBIDA DE IMÁGENES
  ============================================================ */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const list = [...uploadedImages];

    Array.from(files).forEach(file => {
      if (list.length < 5) {
        const reader = new FileReader();
        reader.onload = () => {
          list.push(reader.result as string);
          setUploadedImages([...list]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="zoom-controls">
          <button className="btn-zoom" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="btn-zoom" onClick={() => setZoom(z => Math.min(5, z + 0.1))}>+</button>
          <button className="btn-zoom" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <button className="btn-import">Importar</button>
        <button className="btn-export">Exportar</button>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div style={{ display: "flex", height: "100vh", width: "100%" }}>

        {/* SIDEBAR */}
        <aside className="sidebar">

          {/* PROMPT */}
          <div className="sidebar-box">
            <h2>Prompt</h2>
            <textarea
              placeholder="Describe la imagen..."
              className="w-full"
            />
          </div>

          {/* IMÁGENES */}
          <div className="sidebar-box">
            <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

            <label className="upload-box">
              <span>Haz clic o arrastra imágenes</span>
              <input type="file" multiple className="hidden" onChange={handleImageUpload} />
            </label>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {uploadedImages.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  width={200}
                  height={200}
                  alt="ref"
                  className="rounded-md object-cover h-20 w-full"
                />
              ))}
            </div>
          </div>

          {/* ASPECT RATIO */}
          <div className="sidebar-box">
            <h2>Relación de aspecto</h2>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Modo lista</span>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={modeList}
                  onChange={() => setModeList(!modeList)}
                />
                <span className="slider" />
              </label>
            </div>

            {modeList ? (
              <select
                className="select-mode"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                {sizes.map(s => (
                  <option key={s.label} value={s.label}>
                    {s.label} — {s.size}px
                  </option>
                ))}
              </select>
            ) : (
              <div className="aspect-list">
                {sizes.map(s => (
                  <div
                    key={s.label}
                    className={`aspect-item ${selectedSize === s.label ? "active" : ""}`}
                    onClick={() => setSelectedSize(s.label)}
                  >
                    <div
                      className="mini-rect"
                      style={{
                        width: s.ratio >= 1 ? "38px" : `${38 * s.ratio}px`,
                        height: s.ratio <= 1 ? "38px" : `${38 / s.ratio}px`,
                      }}
                    />
                    <p className="ratio">{s.label}</p>
                    <p className="type">{s.type}</p>
                    <p className="px">{s.size}px</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FORMATO */}
          <div className="sidebar-box">
            <h2>Selecciona el formato</h2>
            <div className="flex gap-2 flex-nowrap">
              {["JPG", "PNG", "WEBP", "BMP"].map(f => (
                <button
                  key={f}
                  className={`format-btn ${format === f ? "active" : ""}`}
                  onClick={() => setFormat(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* GENERAR */}
          <button className="w-full bg-black text-white py-3 rounded-md mt-3">
            Generar imagen
          </button>

          <p className="text-xs text-white mt-5 text-center">
            © 2025 Kreative 360º — Panel PicTULAB
          </p>

        </aside>

        {/* PREVIEW ZONE */}
        <section className="preview-zone">
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center"
          >
            <div
              className="preview-inner"
              style={{
                width: previewDims.w * zoom,
                height: previewDims.h * zoom,
              }}
            >
              Vista previa ({selected?.size}px)
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

