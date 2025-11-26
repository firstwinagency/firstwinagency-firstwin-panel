import "./globals.css";

export const metadata = {
  title: "Panel PicTULAB — Kreative 360º",
  description: "Panel interno para generación de imágenes con referencia",
};

export default function PictuLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body className="bg-white text-black antialiased w-full h-full">
        {children}
      </body>
    </html>
  );
}
