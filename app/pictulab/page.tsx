"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PictuLabPage() {
  const [selectedSize, setSelectedSize] = useState("1:1 (cuadrado)");
  const [modeList, setModeList] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 });

  const sizes = [
    { label: "1:1 (cuadrado)", size: "1024×1024", ratio: 1 },
    { label: "2:3 (vertical)", size: "832×1248", ratio: 0.66 },
    { label: "16:9 (horizontal)", size: "1344×768", ratio: 1.77 },
    { label: "21:9 (horizontal)", size: "1536×672", ratio: 2.28 },
  ];

  const selectedSizeObj = sizes.find((s) => s.label === selectedSize);
  const selectedRatio = selectedSizeObj?.ratio ?? 1;
  const selectedSizeLabel = selectedSizeObj?.size;

  // -----------------------------
  // IMAGENES
  // -----------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImgs = [...uploadedImages];

    Array.from(files).forEach((file) => {
      if (newImgs.length < 5) {
        const reader = new FileReader();
        reader.onload = () => {
          newImgs.push(reader.result as string);
          setUploadedImages([...newImgs]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    const arr = [...uploadedImages];
    arr.splice(index, 1);
    setUploadedImages(arr);
  };

  // -----------------------------
  // PREVIEW AUTOSIZE
  // -----------------------------
  useEffect(() => {
    function update() {
      if (!containerRef.current) return;

      const maxW = containerRef.current.clientWidth * 0.9;
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
    <main className="flex h-screen w-screen overflow-hidden bg-white">

      {/* TOPBAR */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b flex items-center justify-end px-6 py-3">

        {/* ZOOM CONTROLS */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} className="border px-3 py-1 rounded-md">-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="border px-3 py-1 rounded-md">+</button>
          <button onClick={() => setZoom(1)} className="border px-3 py-1 rounded-md">Reset</button>
        </div>

        <button className="border px-4 py-2 rounded-md bg-white hover:bg-gray-100">Importar</button>
        <button className="border px-4 py-2 rounded-md bg-[#FF6B6B] text-white font-semibold">Exportar</button>
      </div>

      {/* SIDEBAR */}
      <aside className="w-80 bg-[#FF6B6B] p-4 flex flex-col gap-4 pt-20 overflow-y-auto">

        {/* PROMPT */}
        <div className="bg-white p-3 rounded-xl shadow border">
          <h2 className="font-semibold mb-1">Prompt</h2>
          <textarea
            placeholder="Describe brevemente la imagen que quieres generar..."
            className="w-full h-24 p-2 border border-gray-200 rounded-md text-sm"
          />
        </div>

        {/* IMÁGENES */}
        <div className="bg-white p-3 rounded-xl shadow border">
          <h2 className="font-semibold mb-1">Imágenes de referencia ({uploadedImages.length}/5)</h2>

          <label className="block border border-dashed border-gray-300 rounded-md py-8 text-center text-sm cursor-pointer bg-gray-50">
            <span>Haz clic o arrastra imágenes aquí</span>
            <input type="file" className="hidden" multiple onChange={handleImageUpload} />
          </label>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {uploadedImages.map((img, i) => (
              <div
                key={i}
                className="relative cursor-pointer"
                onClick={() => {
                  setViewerImage(img);
                  setIsViewerOpen(true);
                }}
              >
                <Image src={img} width={200} height={200} alt="ref" className="rounded-md object-cover h-20 w-full" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  className="absolute top-1 right-1 bg-black/70 text-white w-5 h-5 rounded text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ASPECT RATIO */}
        <div className="bg-white p-3 rounded-xl shadow border">
          <h2 className="font-semibold mb-2">Relación de aspecto</h2>

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
            <div className="flex overflow-x-auto gap-3 pb-2">
              {sizes.map((item) => (
                <div
                  key={item.label}
                  onClick={() => setSelectedSize(item.label)}
                  className={`flex-shrink-0 w-24 p-2 border rounded-lg text-center cursor-pointer transition-all ${
                    selectedSize === item.label
                      ? "border-black shadow-md"
                      : "border-gray-300"
                  }`}
                >
                  <div
                    className="mx-auto mb-1 bg-gray-200 rounded-sm"
                    style={{
                      width: item.ratio >= 1 ? "36px" : `${36 * item.ratio}px`,
                      height: item.ratio <= 1 ? "36px" : `${36 / item.ratio}px`,
                    }}
                  ></div>

                  <p className="text-xs font-medium leading-3">{item.label}</p>
                  <p className="text-[11px] text-gray-600 font-semibold">{item.size} px</p>
                </div>
              ))}
            </div>
          ) : (
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {sizes.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label} — {item.size} px
                </option>
              ))}
            </select>
          )}
        </div>

        {/* FORMATO */}
        <div className="bg-white p-3 rounded-xl shadow border">
          <h2 className="font-semibold mb-2">Selecciona el formato</h2>
          <div className="flex gap-2 justify-between">
            {["JPG", "PNG", "WEBP", "BMP"].map((f) => (
              <button
                key={f}
                className="px-4 py-1 border rounded-md min-w-[62px] text-center bg-white"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <button className="mt-4 bg-black text-white py-2 rounded-lg hover:bg-gray-800">
          Generar imagen
        </button>

        <p className="text-xs text-white text-center mt-auto">
          © 2025 Kreative 360º — Panel PicTULAB
        </p>
      </aside>

      {/* PREVIEW ZONE */}
      <section className="flex-1 h-screen bg-[url('/coral-grid.svg')] bg-repeat flex items-center justify-center pt-20">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
          <div
            style={{
              width: previewDims.w * zoom,
              height: previewDims.h * zoom,
              border: "1px solid #ccc",
              background: "rgba(255,255,255,0.85)",
            }}
            className="flex items-center justify-center text-gray-700 text-sm rounded-md shadow"
          >
            Vista previa ({selectedSizeLabel}px)
          </div>
        </div>
      </section>

      {/* VIEWER */}
      {isViewerOpen && viewerImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setIsViewerOpen(false)}
        >
          <Image
            src={viewerImage}
            alt="view"
            width={1000}
            height={1000}
            className="rounded-lg shadow-lg max-h-[85vh] object-contain"
          />
        </div>
      )}
    </main>
  );
}

