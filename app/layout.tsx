// /app/layout.tsx
import "./globals.css";
import { Inter, DM_Serif_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata = {
  title: "FirstWin · Generador de Imágenes Masivo IA por Kreative 360º — Panel de trabajo",
  description: "Genera imágenes de producto con múltiples referencias.",
  icons: { icon: "/icon.png" }, // sube public/icon.png en el paso 4
  themeColor: "#FF6D6D", // coral Kreative 360º
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* Inter como tipografía base; DM Serif se aplica a headings por CSS */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}
