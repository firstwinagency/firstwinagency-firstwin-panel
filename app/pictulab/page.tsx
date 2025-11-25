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
    { label: "A3 horizontal (4961×3508 px)", size: "4961×3508", ratio: 1.41 }
  ];

  const selected = sizes.find(s => s.label === selectedSize);
  const ratio = selected?.ratio ?? 1;

  const [previewDims, setPreviewDims] = useState({ w: 400, h: 400 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const maxW = containerRef.current.clientWidth * 0.85;
      const maxH = containerRef.current.clientHeight * 0.85;

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

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="zoom-controls">
          <button className="btn-zoom" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="btn-zoom" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
          <button className="btn-zoom" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <button className="btn-import">Importar</button>
        <button className="btn-export">Exportar</button>
      </div>

      {/* STRUCTURE */}
      <div style={{ display: "flex", height: "100vh", width: "100%" }}>

        {/* SIDEBAR */}
        <aside className="sidebar">

          {/* PROMPT */}
          <div className="sidebar-box">
            <h2>Prompt</h2>
            <textarea
              placeholder="Describe la imagen..."
              className="w-full h-24 border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>

          {/* IMÁGENES */}
          <div className="sidebar-box">
            <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

            <label className="block border border-dashed border-gray-400 rounded-md py-8 text-center cursor-pointer">
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
              <span className="text-sm">Modo lista</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={modeList}
                  onChange={() => setModeList(!modeList)}
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-gray-800 transition-all"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>

            {modeList ? (
              <select
                className="w-full border rounded-md p-2 text-sm"
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
                        width: s.ratio >= 1 ? "40px" : `${40 * s.ratio}px`,
                        height: s.ratio <= 1 ? "40px" : `${40 / s.ratio}px`,
                      }}
                    />
                    <p>{s.label}</p>
                    <p>{s.size}px</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FORMATO */}
          <div className="sidebar-box">
            <h2>Selecciona el formato</h2>
            <div className="flex gap-2">
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

          <button className="w-full bg-black text-white py-3 rounded-md mt-3 hover:bg-gray-900">
            Generar imagen
          </button>

          <p className="text-xs text-white mt-5 text-center">
            © 2025 Kreative 360º — Panel PicTULAB
          </p>
        </aside>

        {/* PREVIEW */}
        <section className="preview-zone">
          <div ref={containerRef} className="w-full h-full flex items-center justify-center">
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
