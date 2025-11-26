"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {
  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [format, setFormat] = useState("JPG");

  const containerRef = useRef<HTMLDivElement>(null);

  // ==== LISTA REAL DE TAMAÑOS ====
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

    { label: "A5 vertical", type: "(vertical)", size: "1748×2480", ratio: 0.7 },
    { label: "A5 horizontal", type: "(horizontal)", size: "2480×1748", ratio: 1.42 },
    { label: "A4 vertical", type: "(vertical)", size: "2480×3508", ratio: 0.7 },
    { label: "A4 horizontal", type: "(horizontal)", size: "3508×2480", ratio: 1.41 },
    { label: "A3 vertical", type: "(vertical)", size: "3508×4961", ratio: 0.7 },
    { label: "A3 horizontal", type: "(horizontal)", size: "4961×3508", ratio: 1.41 },
  ];

  const selected = sizes.find((s) => s.label === selectedSize);
  const ratio = selected?.ratio ?? 1;

  // ============= CALCULAR PREVIEW REAL (COMO EL PANEL ORIGINAL) =============
  const [previewDims, setPreviewDims] = useState({ w: 700, h: 700 });

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

      // Prevención del bug de "empequeñecimiento"
      const MIN = 300;
      if (w < MIN || h < MIN) {
        const scale = Math.max(w / MIN, h / MIN);
        w = MIN * scale;
        h = (MIN * scale) / ratio;
      }

      setPreviewDims({ w, h });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ratio]);

  // ==== SUBIR IMÁGENES ====
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const list = [...uploadedImages];
    Array.from(files).forEach((file) => {
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
      {/* TOPBAR */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b flex items-center justify-end px-6 py-3">
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button className="border px-3 py-1 rounded-md" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="border px-3 py-1 rounded-md" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>+</button>
          <button className="border px-3 py-1 rounded-md" onClick={() => setZoom(1)}>Reset</button>
        </div>

        <button className="border px-4 py-2 rounded-md">Importar</button>
        <button className="border px-4 py-2 rounded-md text-white font-semibold" style={{ background: "#FF6D6D" }}>Exportar</button>
      </div>

      {/* BODY STRUCTURE */}
      <div className="flex min-h-screen bg-white text-black">

        {/* SIDEBAR CORAL */}
        <aside className="w-80 bg-[#FF6B6B] p-4 flex flex-col gap-4 pt-20">

          {/* PROMPT */}
          <div className="bg-white p-3 rounded-xl">
            <h2 className="font-semibold mb-1">Prompt</h2>
            <textarea
              className="w-full h-24 p-2 border rounded-md text-sm"
              placeholder="Describe la imagen..."
            />
          </div>

          {/* IMÁGENES DE REFERENCIA */}
          <div className="bg-white p-3 rounded-xl">
            <h2 className="font-semibold mb-1">Imágenes de referencia ({uploadedImages.length}/5)</h2>

            <label className="block border border-dashed rounded-md py-8 text-center cursor-pointer text-sm">
              Sube o arrastra imágenes
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
          <div className="bg-white p-3 rounded-xl">
            <h2 className="font-semibold mb-2">Relación de aspecto</h2>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Modo lista</span>

              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={modeList} onChange={() => setModeList(!modeList)} />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-gray-800"></div>
                <div className="absolute w-4 h-4 bg-white rounded-full left-0.5 top-0.5 transition-all peer-checked:translate-x-5"></div>
              </label>
            </div>

            {modeList ? (
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                {sizes.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label} — {s.size} px
                  </option>
                ))}
              </select>
            ) : (
              <div className="aspect-list overflow-x-auto flex gap-3">
                {sizes.map((s) => (
                  <div
                    key={s.label}
                    className={`aspect-item ${selectedSize === s.label ? "active" : ""}`}
                    onClick={() => setSelectedSize(s.label)}
                    style={{
                      width: 105,
                      background: "white",
                      padding: "10px 6px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div
                      className="mini-rect"
                      style={{
                        width: s.ratio >= 1 ? "40px" : `${40 * s.ratio}px`,
                        height: s.ratio <= 1 ? "40px" : `${40 / s.ratio}px`,
                      }}
                    />

                    <p className="ratio font-semibold text-[12px]">{s.label}</p>
                    <p className="type text-gray-600 text-[12px]">{s.type}</p>
                    <p className="px text-gray-500 text-[12px]">{s.size} px</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FORMATO */}
          <div className="bg-white p-3 rounded-xl">
            <h2 className="font-semibold mb-2">Selecciona el formato</h2>

            <div className="flex gap-2 justify-between">
              {["JPG", "PNG", "WEBP", "BMP"].map((f) => (
                <button
                  key={f}
                  className={`px-4 py-1 border rounded-md min-w-[62px] ${format === f ? "bg-black text-white" : ""}`}
                  onClick={() => setFormat(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button className="mt-4 bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-500">
            Generar imagen
          </button>

          <p className="text-xs text-white text-center mt-auto">
            © 2025 Kreative 360º — Panel PicTULAB
          </p>
        </aside>

        {/* PREVIEW */}
        <section className="flex-1 h-screen bg-[url('/coral-grid.svg')] bg-repeat flex items-center justify-center">
          <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <div
              style={{
                width: previewDims.w * zoom,
                height: previewDims.h * zoom,
                border: "1px solid #ccc",
                background: "rgba(255,255,255,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#444",
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
