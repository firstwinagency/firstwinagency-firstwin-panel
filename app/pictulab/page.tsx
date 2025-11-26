"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {
  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

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
    { label: "21:9 (horizontal)", size: "1536×672", ratio: 2.28 }
  ];

  const selectedSizeObj = sizes.find((s) => s.label === selectedSize);
  const selectedRatio = selectedSizeObj?.ratio ?? 1;
  const selectedLabel = selectedSizeObj?.size;

  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const maxW = containerRef.current.clientWidth * 0.7;
      const maxH = containerRef.current.clientHeight * 0.7;

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

  const handleFiles = (e: any) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const existing = [...uploadedImages];

    files.forEach((file: any) => {
      if (existing.length < 5) {
        const reader = new FileReader();
        reader.onload = () => {
          existing.push(reader.result as string);
          setUploadedImages([...existing]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (i: number) => {
    const arr = [...uploadedImages];
    arr.splice(i, 1);
    setUploadedImages(arr);
  };

  return (
    <main className="flex min-h-screen">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="zoom-controls">
          <button className="btn-zoom" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="btn-zoom" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
          <button className="btn-zoom" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <button className="btn-zoom">Importar</button>
        <button className="btn-zoom" style={{ background: "#FF6D6D", color: "white" }}>Exportar</button>
      </div>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-box">
          <h2>Prompt</h2>
          <textarea placeholder="Describe brevemente la imagen que quieres generar..."></textarea>
        </div>

        <div className="sidebar-box">
          <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

          <label>
            <span>Haz clic o arrastra imágenes aquí</span>
            <input type="file" multiple className="hidden" onChange={handleFiles} />
          </label>

          <div className="image-grid mt-2 grid grid-cols-2 gap-2">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative" onClick={() => { setViewerImage(img); setIsViewerOpen(true); }}>
                <Image src={img} width={200} height={200} alt="ref" className="rounded-md object-cover h-20 w-full" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-1 right-1 bg-black/70 text-white w-5 h-5 rounded text-xs"
                >X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-box">
          <h2>Relación de aspecto</h2>

          <div className="toggle-wrap">
            <span>Modo lista</span>
            <div className="toggle" onClick={() => setModeList(!modeList)}>
              <div className={`toggle-thumb ${modeList ? "active" : ""}`}></div>
            </div>
          </div>

          {modeList && (
            <div className="aspect-list">
              {sizes.map((s) => (
                <div
                  key={s.label}
                  className={`aspect-item ${selectedSize === s.label ? "active" : ""}`}
                  onClick={() => setSelectedSize(s.label)}
                >
                  <div
                    className="mini-rect"
                    style={{
                      width: s.ratio >= 1 ? "36px" : `${36 * s.ratio}px`,
                      height: s.ratio <= 1 ? "36px" : `${36 / s.ratio}px`,
                    }}
                  ></div>

                  <p className="ratio">{s.label}</p>
                  <p className="px">{s.size} px</p>
                </div>
              ))}
            </div>
          )}

          {!modeList && (
            <select className="aspect-select" value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
              {sizes.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label} — {s.size} px
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="sidebar-box">
          <h2>Selecciona el formato</h2>
          <div className="format-buttons">
            {["JPG", "PNG", "WEBP", "BMP"].map((f) => (
              <button key={f} className="format-btn">{f}</button>
            ))}
          </div>
        </div>

        <button className="generate-btn">Generar imagen</button>

        <p className="text-xs text-white text-center mt-auto">
          © 2025 Kreative 360º — Panel PicTULAB
        </p>
      </aside>

      {/* PREVIEW */}
      <section className="preview-zone" ref={containerRef}>
        <div
          className="preview-inner"
          style={{
            width: previewDims.w * zoom,
            height: previewDims.h * zoom,
          }}
        >
          Vista previa ({selectedLabel} px)
        </div>
      </section>

      {/* IMAGE VIEWER */}
      {isViewerOpen && viewerImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
             onClick={() => setIsViewerOpen(false)}>
          <Image src={viewerImage} alt="big view" width={1200} height={1200} className="rounded-lg shadow-lg max-h-[85vh]" />
        </div>
      )}
    </main>
  );
}

