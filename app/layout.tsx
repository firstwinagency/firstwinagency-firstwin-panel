"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Página principal NO lleva menú
  const isHome = pathname === "/";

  return (
    <html lang="es">
      <body style={{ background: "#0b0c0e" }}>
        
        {/* sidebar solo en masivo y pictulab */}
        {!isHome && (
          <>
            {/* botón menú */}
            <button
              onClick={() => setOpen(!open)}
              style={{
                position: "fixed",
                top: 20,
                left: 20,
                zIndex: 40,
                background: "#fff",
                width: 42,
                height: 42,
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: 22,
              }}
            >
              ☰
            </button>

            {/* sidebar */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: open ? 0 : "-260px",
                width: 260,
                height: "100vh",
                background: "white",
                borderRight: "1px solid #eee",
                padding: "28px 18px",
                zIndex: 35,
                transition: "left 0.3s ease",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#FF6D6D", marginBottom: 24 }}>
                Kreative 360º
              </h1>

              <Link
                href="/masivo"
                style={{
                  padding: "14px 16px",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  marginBottom: 12,
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                Generador de Imágenes Masivo
              </Link>

              <Link
                href="/pictulab"
                style={{
                  padding: "14px 16px",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  marginBottom: 12,
                  fontWeight: 600,
                  color: "#000",
                }}
              >
                Panel PicTULAB
              </Link>

              <p style={{ marginTop: "auto", color: "#666", fontSize: 12 }}>
                © 2025 Kreative 360º
              </p>
            </div>
          </>
        )}

        {children}
      </body>
    </html>
  );
}

