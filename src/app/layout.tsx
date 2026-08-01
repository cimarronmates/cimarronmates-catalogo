import type { Metadata } from "next";
import { Archivo, Piazzolla } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config";

// Piazzolla (Huerta Tipográfica, Buenos Aires) carries the headings — an
// Argentine serif with enough character to sit beside the emblem.
const piazzolla = Piazzolla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-piazzolla",
  weight: ["500", "600", "700"],
});

// Archivo is a signage grotesque: the almacén-enamel lineage, high legibility.
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.brandName} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.brandName}`,
  },
  description: `Mates, bombillas, termos y todo para el mate. Artesanales y elegidos uno por uno en ${siteConfig.city}. Consultá por WhatsApp.`,
  applicationName: siteConfig.brandName,
  openGraph: {
    title: `${siteConfig.brandName} — ${siteConfig.tagline}`,
    description: `Mates, bombillas, termos y todo para el mate en ${siteConfig.city}.`,
    locale: "es_AR",
    type: "website",
    siteName: siteConfig.brandName,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${piazzolla.variable} ${archivo.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#catalogo"
          className="sr-only rounded-lg bg-marca-700 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
        >
          Saltar al catálogo
        </a>
        {children}
      </body>
    </html>
  );
}
