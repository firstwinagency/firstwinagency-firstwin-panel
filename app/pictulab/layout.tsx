export const metadata = {
  title: "Panel PicTULAB",
  description: "Herramienta interna de Kreative 360º",
};

export default function PictuLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-grid text-black antialiased">
        {children}
      </body>
    </html>
  );
}
