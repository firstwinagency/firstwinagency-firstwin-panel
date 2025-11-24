"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fefefe",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "380px",
          background: "white",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "24px", fontSize: "24px", fontWeight: 800 }}>
          Kreative 360º · Panel de IA
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <Link
            href="/masivo"
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              background: "#ff6b6b",
              color: "white",
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
              fontSize: "16px",
            }}
          >
            Generador de Imágenes Masivo
          </Link>

          <Link
            href="/pictulab"
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              background: "#111",
              color: "#ff6b6b",
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
              fontSize: "16px",
            }}
          >
            Panel PicTULAB
          </Link>

        </div>

        <p
          style={{
            marginTop: "28px",
            fontSize: "12px",
            color: "#888",
          }}
        >
          © {new Date().getFullYear()} Kreative 360º
        </p>
      </div>
    </main>
  );
}
