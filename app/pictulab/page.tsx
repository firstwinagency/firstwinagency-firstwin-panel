"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {
  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  const sizes = [
    { label: "1:1 (cuadrado)", size: "1024×1024", ratio: 1 },
    { label: "2:2 (cuadrado)", size: "2000×2000", ratio: 1 },
    { label: "2:3 (vertical)", size: "832×1248", ratio: 0.66 },
    { label: "3:4 (vertical)", size: "864×1184", ratio: 0.73 },
    { label: "4:5 (vertical)", size: "896×1152", ratio: 0.78 },
    { label: "9:16 (vertical)", size: "768×1344", ratio: 0.56 },
    { label: "21:9 (vertical)", size: "672×1536", ratio: 0.43 },
    { label: "3:2 (horizontal)", size: "1248×832", ratio: 1.5 },
    { label: "4:3 (horizontal)", size: "1184×864", ratio: 1.37 },
    { label: "5:4 (horizontal)", size: "1152×896", ratio: 1.28 },
    { label: "16:9 (horizontal)", size: "1344×768", ratio: 1.77 },
    { label: "21:9 (horizontal)", size: "1536×672", ratio: 2.28 },
    { label: "A5 vertical (1748×2480 px)", size: "1748×2480", ratio: 0.7 },
    { label: "A5 horizontal (2480×1748 px)", size: "2480×1748", ratio: 1.42 },
    { label: "A4 vertical (2480×3508 px)", size: "2480×3508", ratio: 0.7 },
    { label: "A4 horizontal (3508×2480 px)", size: "3508×2480", ratio: 1.41 },
    { label: "A3 vertical (3508×4961 px)", size: "3508×4961", ratio: 0.7 },
    { label: "A3 horizontal (4961×3508 px)", size: "4961×3508", ratio: 1.41 },
  ];

  const selectedSizeObj = sizes.find(s => s.label === selectedSize);
  const selectedRatio = selectedSizeObj?.ratio ?? 1;

  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const maxW = containerRef.current.clientWidth * 0.8;
      const maxH = containerRef.current.clientHeight * 0.75;

      let w = maxW;
      let h = w / selectedRatio;

      if (h > maxH) {
        h = maxH;
        w = h * selectedRatio;
      }

      setPreviewDims({ w, h });
    }

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [selectedRatio, zoom]);

  return (
    <main className="flex">

      {/* TOPBAR */}
      <div className="topbar">

        <div className="zoom-controls">
          <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
          <button className="zoom-btn" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <button className="import-btn">Importar</button>
        <button className="export-btn">Exportar</button>
      </div>

      {/* SIDEBAR */}
      <aside className="sidebar">
        
        {/* PROMPT */}
        <div className="sidebar-box">
          <h2>Prompt</h2>
          <textarea className="w-full h-24 p-2 border rounded-md text-sm" placeholder="Describe la imagen..."></textarea>
        </div>

        {/* IMAGES */}
        <div className="sidebar-box">
          <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

          <label className="block border border-dashed rounded-md py-6 text-center text-sm cursor-pointer">
            Sube o arrastra imágenes
            <input type="file" className="hidden" multiple />
          </label>
        </div>

        {/* ASPECT RATIO */}
        <div className="sidebar-box">
          <h2>Relación de aspecto</h2>

          <div className="aspect-scroll">
            {sizes.map(item => (
              <div
                key={item.label}
                className={`aspect-item ${selectedSize === item.label ? "active" : ""}`}
                onClick={() => setSelectedSize(item.label)}
              >
                <div
                  className="mini-rect"
                  style={{
                    width: item.ratio >= 1 ? "36px" : `${36 * item.ratio}px`,
                    height: item.ratio <= 1 ? "36px" : `${36 / item.ratio}px`
                  }}
                ></div>

                <p>{item.label}</p>
                <p style={{ color: "#666", fontSize: "10px" }}>{item.size}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FORMAT */}
        <div className="sidebar-box">
          <h2>Selecciona el formato</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {["JPG", "PNG", "WEBP", "BMP"].map(f => (
              <button key={f} className="px-3 py-1 border rounded-md">{f}</button>
            ))}
          </div>
        </div>

        <button className="mt-3 bg-black text-white py-2 rounded-md">Generar imagen</button>

        <p className="text-xs text-white mt-auto text-center">
          © 2025 Kreative 360º — Panel PicTULAB
        </p>
      </aside>

      {/* PREVIEW */}
      <section ref={containerRef} className="preview-wrapper">
        <div
          className="preview-canvas"
          style={{
            width: previewDims.w * zoom,
            height: previewDims.h * zoom
          }}
        >
          Vista previa ({selectedSizeObj?.size}px)
        </div>
      </section>

    </main>
  );
}

