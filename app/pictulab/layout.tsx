import "../globals.css";

export const metadata = {
  title: "Panel PicTULAB — Kreative 360º",
  description: "Panel interno para generación de imágenes con referencia",
};

export default function PictuLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="__className_f367f3 bg-white text-black">
        {children}
      </body>
    </html>
  );
}
