import "./globals.css";

export const metadata = {
  title: "Firstwin Panel",
  description: "Panel interno Kreative 360º",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
