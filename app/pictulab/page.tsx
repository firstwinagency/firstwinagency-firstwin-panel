"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {
  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(false);
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
    { label: "21:9 (horizontal)", size: "1536×672", ratio: 2.28 },
    { label: "A5 vertical (1748×2480 px)", size: "1748×2480", ratio: 0.7 },
    { label: "A5 horizontal (2480×1748 px)", size: "2480×1748", ratio: 1.42 },
    { label: "A4 vertical (2480×3508 px)", size: "2480×3508", ratio: 0.7 },
    { label: "A4 horizontal (3508×2480 px)", size: "3508×2480", ratio: 1.41 },
    { label: "A3 vertical (3508×4961 px)", size: "3508×4961", ratio: 0.7 },
    { label: "A3 horizontal (4961×3508 px)", size: "4961×3508", ratio: 1.41 }
  ];

  const selectedSizeObj = sizes.find((s) => s.label === selectedSize);
  const selectedRatio = selectedSizeObj?.ratio ?? 1;
  const selectedSizeLabel = selectedSizeObj?.size;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = [...uploadedImages];

    Array.from(files).forEach((file) => {
      if (newImages.length < 5) {
        const reader = new FileReader();
        reader.onload = () => {
          newImages.push(reader.result as string);
          setUploadedImages([...newImages]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    const imgs = [...uploadedImages];
    imgs.splice(index, 1);
    setUploadedImages(imgs);
  };

  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function update() {
      if (!containerRef.current || !selectedRatio) return;

      const maxW = containerRef.current.clientWidth * 0.9;
      const maxH = containerRef.current.clientHeight * 0.8;

      let targetW = maxW;
      let targetH = targetW / selectedRatio;

      if (targetH > maxH) {
        targetH = maxH;
        targetW = targetH * selectedRatio;
      }

      setPreviewDims({ w: targetW, h: targetH });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [selectedRatio, zoom]);

  return (
    <main className="flex min-h-screen bg-white text-black">

      {/* TOP BAR */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b flex items-center justify-end px-6 py-3 topbar">

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 zoom-controls">
          <button className="btn-zoom" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>-</button>
          <span className="px-2">{Math.round(zoom * 100)}%</span>
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
          <textarea className="w-full h-24 p-2 border rounded-md text-sm" placeholder="Describe la imagen..."></textarea>
        </div>

        <div className="sidebar-box">
          <h2>Imágenes de referencia ({uploadedImages.length}/5)</h2>

          <label className="block border border-dashed rounded-md py-8 text-center text-sm cursor-pointer">
            <span>Sube o arrastra imágenes</span>
            <input type="file" className="hidden" multiple onChange={handleImageUpload} />
          </label>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative cursor-pointer" onClick={() => { setViewerImage(img); setIsViewerOpen(true); }}>
                <Image src={img} width={200} height={200} alt="ref" className="rounded-md object-cover h-20 w-full" />
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="absolute top-1 right-1 bg-black/70 text-white w-5 h-5 rounded text-xs">X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-box">
          <h2>Relación de aspecto</h2>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Modo lista</span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={modeList} onChange={() => setModeList(!modeList)} />
              <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-gray-800 transition-all"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
            </label>
          </div>

          {modeList && (
            <div className="aspect-list">
              {sizes.map((item) => (
                <div key={item.label} onClick={() => setSelectedSize(item.label)}
                  className={`aspect-item ${selectedSize === item.label ? "active" : ""}`}>
                  <div className="mini-rect"
                    style={{
                      width: item.ratio >= 1 ? "36px" : `${36 * item.ratio}px`,
                      height: item.ratio <= 1 ? "36px" : `${36 / item.ratio}px`
                    }}>
                  </div>
                  <p>{item.label}</p>
                  <p>{item.size} px</p>
                </div>
              ))}
            </div>
          )}

          {!modeList && (
            <select className="w-full border rounded-md p-2 text-sm"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}>
              {sizes.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label} — {item.size} px
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="sidebar-box">
          <h2>Selecciona el formato</h2>
          <div className="flex gap-2">
            {["JPG", "PNG", "WEBP", "BMP"].map((f) => (
              <button key={f} className="px-4 py-1 border rounded-md w-full text-center">{f}</button>
            ))}
          </div>
        </div>

        <button className="btn">Generar imagen</button>

        <p className="text-xs text-white text-center mt-auto">
          © 2025 Kreative 360º — Panel PicTULAB
        </p>
      </aside>

      <section className="preview-zone">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
          <div className="preview-inner" style={{
            width: previewDims.w * zoom,
            height: previewDims.h * zoom,
          }}>
            Vista previa ({selectedSizeLabel} px)
          </div>
        </div>
      </section>

      {isViewerOpen && viewerImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setIsViewerOpen(false)}>
          <Image src={viewerImage} alt="visualizador" width={1000} height={1000}
            className="rounded-lg shadow-lg max-h-[85vh] object-contain" />
        </div>
      )}

    </main>
  );
}
