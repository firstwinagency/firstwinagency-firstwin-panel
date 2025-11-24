"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-[#FF6B6B] text-black">

      {/* LEFT MENU (igual que antes) */}
      <aside className="w-64 bg-white h-screen p-6 border-r flex flex-col">
        
        <h1 className="text-2xl font-bold mb-10">Kreative 360º</h1>

        <nav className="flex flex-col gap-4">
          <Link
            href="/masivo"
            className="block bg-white border rounded-lg py-3 px-4 text-center font-semibold shadow hover:bg-gray-100 transition"
          >
            Generador de Imágenes Masivo
          </Link>

          <Link
            href="/pictulab"
            className="block bg-white border rounded-lg py-3 px-4 text-center font-semibold shadow hover:bg-gray-100 transition"
          >
            Panel PicTULAB
          </Link>
        </nav>

        <div className="mt-auto text-xs text-gray-500">
          © 2025 Kreative 360º
        </div>
      </aside>

      {/* MAIN PANEL */}
      <section className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Bienvenido al Panel de Herramientas IA
          </h2>
          <p className="text-white/90 mb-10">
            Selecciona una de las opciones del menú para comenzar.
          </p>
        </div>
      </section>

    </main>
  );
}

