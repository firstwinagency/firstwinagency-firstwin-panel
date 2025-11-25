"use client";

import "./globals.css";

export default function PictuLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="pictulab-body">
        {children}
      </body>
    </html>
  );
}
