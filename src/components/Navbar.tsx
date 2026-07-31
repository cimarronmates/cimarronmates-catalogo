"use client";

import { useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/config";

const LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#destacados", label: "Destacados" },
  { href: "#catalogo", label: "Catálogo" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-marca-700/95 backdrop-blur text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#inicio" className="flex items-center gap-2">
          <Image src="/logo.png" alt={siteConfig.brandName} width={40} height={40} className="h-10 w-auto" />
        </a>

        <nav className="hidden gap-6 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-marca-blush">
              {link.label}
            </a>
          ))}
        </nav>

        <button
          className="md:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-white" />
          <span className="mt-1.5 block h-0.5 w-6 bg-white" />
          <span className="mt-1.5 block h-0.5 w-6 bg-white" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 md:hidden">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-1">
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
