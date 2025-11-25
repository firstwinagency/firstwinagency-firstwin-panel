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
    { label: "A3 horizontal (4961×3508 px)", size: "4961×3508", ratio: 1.41 }
  ];

  const selected = sizes.find(s => s.label === selectedSize);
  const ratio = selected?.ratio ?? 1;

  const [previewDims, setPreviewDims] = useState({ w: 400, h: 400 });

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const maxW = containerRef.current.clientWidth * 0.8;
      const maxH = containerRef.current.clientHeight * 0.8;

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
    const newImgs = [...uploadedImages];

    Array.from(files).forEach(file => {
      if (newImgs.length < 5) {
        const r = new FileReader();
        r.onload = () => {
          newImgs.push(r.result as string);
          setUploadedImages([...newImgs]);
        };
        r.readAsDataURL(file);
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

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-box">
          <h2>Prompt</h2>
          <textarea placeholder="Describe la imagen..."></textarea>
        </div>

        <div className="sidebar-box">
          <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

          <label className="block border border-dashed border-gray-400 rounded-md py-8 text-center cursor-pointer">
            <span>Haz clic o arrastra imágenes</span>
            <input type="file" multiple className="hidden" onChange={handleImageUpload} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
            {uploadedImages.map((img, i) => (
              <Image
                key={i}
                src={img}
                width={200}
                height={200}
                alt="ref"
                style={{
                  width: "100%",
                  height: "80px",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            ))}
          </div>
        </div>

        <div className="sidebar-box">
          <h2>Relación de aspecto</h2>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "14px" }}>Modo lista</span>
            <input type="checkbox" checked={modeList} onChange={() => setModeList(!modeList)} />
          </div>

          {modeList ? (
            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
              {sizes.map(s => (
                <option key={s.label} value={s.label}>
                  {s.label} — {s.size}
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

        <div className="sidebar-box">
          <h2>Selecciona el formato</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {["JPG", "PNG", "WEBP", "BMP"].map(f => (
              <button key={f} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: "6px" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <button style={{
          width: "100%",
          background: "black",
          color: "white",
          padding: "12px",
          borderRadius: "10px",
          marginTop: "12px",
          cursor: "pointer"
        }}>
          Generar imagen
        </button>

        <p style={{ fontSize: "12px", color: "white", marginTop: "20px", textAlign: "center" }}>
          © 2025 Kreative 360º — Panel PicTULAB
        </p>
      </aside>

      {/* PREVIEW */}
      <section className="preview-zone">
        <div ref={containerRef} style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div
            className="preview-inner"
            style={{
              width: previewDims.w * zoom,
              height: previewDims.h * zoom,
            }}
          >
            Vista previa ({selected?.size})
          </div>
        </div>
      </section>
    </>
  );
}
