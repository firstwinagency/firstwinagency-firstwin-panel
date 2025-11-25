export const metadata = {
  title: "Panel PicTULAB",
  description: "Generador interno de imágenes Kreative 360º",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
