import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { buildContactoLink } from "@/lib/whatsapp";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contacto" className="bg-marca-cream px-4 py-12 text-marca-700">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <Image src="/logo.png" alt={siteConfig.brandName} width={64} height={64} className="h-16 w-auto" />

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
          <a
            href={`https://instagram.com/${siteConfig.instagramHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-marca-400"
          >
            📷 {siteConfig.instagramHandle}
          </a>
          <a href={buildContactoLink()} target="_blank" rel="noopener noreferrer" className="hover:text-marca-400">
            💬 WhatsApp
          </a>
          <span>📍 {siteConfig.city}</span>
        </div>

        <p className="text-sm text-neutral-mid">© {year} {siteConfig.brandName}</p>
      </div>
    </footer>
  );
}
