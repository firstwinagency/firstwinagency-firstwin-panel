import "./globals.css";

export const metadata = {
  title: "Panel PicTULAB — Kreative 360º",
  description: "Panel interno para generación de imágenes",
};

export default function PictuLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
