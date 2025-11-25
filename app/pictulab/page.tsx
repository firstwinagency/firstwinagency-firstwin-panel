"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {
  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [format, setFormat] = useState("JPG");
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  const sizes = [
    { label: "1:1 (cuadrado)", type: "(cuadrado)", size: "1024×1024", ratio: 1 },
    { label: "2:2 (cuadrado)", type: "(cuadrado)", size: "2000×2000", ratio: 1 },
    
    { label: "2:3 (vertical)",  type: "(vertical)", size: "832×1248",  ratio: 0.66 },
    { label: "3:4 (vertical)",  type: "(vertical)", size: "864×1184",  ratio: 0.73 },
    { label: "4:5 (vertical)",  type: "(vertical)", size: "896×1152",  ratio: 0.78 },
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

  const [previewDims, setPreviewDims] = useState({ w: 500, h: 500 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const W = containerRef.current.clientWidth * 0.82;
      const H = containerRef.current.clientHeight * 0.82;

      let w = W;
      let h = w / ratio;

      if (h > H) {
        h = H;
        w = h * ratio;
      }
      setPreviewDims({ w, h });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ratio]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const updated = [...uploadedImages];

    Array.from(files).forEach(file => {
      if (updated.length < 5) {
        const r = new FileReader();
        r.onload = () => {
          updated.push(r.result as string);
          setUploadedImages([...updated]);
        };
        r.readAsDataURL(file);
      }
    });
  };

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="zoom-controls">
          <button className="btn-zoom" onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="btn-zoom" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
          <button className="btn-zoom" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <button className="btn-import">Importar</button>
        <button className="btn-export">Exportar</button>
      </div>

      <div style={{ display: "flex", height: "100vh", width: "100%" }}>

        {/* SIDEBAR */}
        <aside className="sidebar">

          {/* PROMPT */}
          <div className="sidebar-box">
            <h2>Prompt</h2>
            <textarea placeholder="Describe la imagen..." />
          </div>

          {/* IMÁGENES */}
          <div className="sidebar-box">
            <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

            <label>
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

          {/* RELACIÓN DE ASPECTO */}
          <div className="sidebar-box">
            <h2>Relación de aspecto</h2>

            <div className="flex items-center justify-between mb-2">
              <span>Modo lista</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={modeList} onChange={() => setModeList(!modeList)} />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-gray-800 transition-all"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>

            {!modeList ? (
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
                        width: s.ratio >= 1 ? "40px" : `${40 * s.ratio}px`,
                        height: s.ratio <= 1 ? "40px" : `${40 / s.ratio}px`,
                      }}
                    />
                    <p className="ratio">{s.label.split(" ")[0]}</p>
                    <p className="type">{s.type}</p>
                    <p className="px">{s.size}px</p>
                  </div>
                ))}
              </div>
            ) : (
              <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
                {sizes.map(s => (
                  <option key={s.label} value={s.label}>
                    {s.label} — {s.size}px
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* FORMATO */}
          <div className="sidebar-box">
            <h2>Formato</h2>
            <div className="format-row">
              {["JPG", "PNG", "WEBP", "BMP"].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`format-btn ${format === f ? "active" : ""}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-generate">Generar imagen</button>
          <p className="text-xs text-white text-center mt-4">© 2025 Kreative 360º — Panel PicTULAB</p>

        </aside>

        {/* PREVIEW */}
        <section className="preview-zone">
          <div ref={containerRef} className="w-full h-full flex justify-center items-center">
            <div
              className="preview-inner"
              style={{
                width: previewDims.w * zoom,
                height: previewDims.h * zoom
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

