// app/pictulab/layout.tsx — versión original del panel PicTULAB

import "../globals.css";

export const metadata = {
  title: "Panel PicTULAB",
  description: "Generador de imágenes interno de Kreative 360º",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-grid">
        {children}
      </body>
    </html>
  );
}
