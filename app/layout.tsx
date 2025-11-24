// /app/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <html lang="es">
      <body>
        {/* Botón toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-4 left-4 z-50 bg-white text-black p-2 rounded shadow"
        >
          ☰
        </button>

        {/* Menú lateral */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 p-6 transform transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <h2 className="text-2xl font-bold mb-8 text-[#FF6D6D]">Kreative 360º</h2>

          <nav className="flex flex-col gap-4">
            <Link
              href="/masivo"
              className="p-3 bg-gray-100 rounded hover:bg-gray-200 shadow"
            >
              Generador de Imágenes Masivo
            </Link>

            <Link
              href="/pictulab"
              className="p-3 bg-gray-100 rounded hover:bg-gray-200 shadow"
            >
              Panel PicTULAB
            </Link>
          </nav>

          <footer className="absolute bottom-4 left-6 text-xs text-gray-500">
            © 2025 Kreative 360º
          </footer>
        </aside>

        {/* Contenido del panel */}
        <div>{children}</div>
      </body>
    </html>
  );
}
