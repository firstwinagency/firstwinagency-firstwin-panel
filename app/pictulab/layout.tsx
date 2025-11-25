// app/pictulab/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Panel PicTULAB",
  description: "Kreative 360º — Panel para generar imágenes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="pictu-body">{children}</body>
    </html>
  );
}
