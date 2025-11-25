// app/pictulab/layout.tsx
import "../pictulab/globals.css";

export const metadata = {
  title: "Panel PicTULAB - Kreative 360º",
  description: "Generador y editor avanzado de imágenes",
};

export default function PictuLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="pictu-body">
        <div className="pictu-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
