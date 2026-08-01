import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { buildContactoLink } from "@/lib/whatsapp";
import { InstagramIcon, MapPinIcon, OrnamentRule, WhatsAppIcon } from "@/components/icons";

const itemBase =
  "inline-flex items-center gap-3 rounded-xl px-3 py-3 text-crema/85 transition-colors duration-200";

export default function Footer() {
  const year = new Date().getFullYear();
  const instagramUser = siteConfig.instagramHandle.replace("@", "");

  return (
    <footer
      id="contacto"
      className="surface-oscura textura-papel relative bg-marca-900 text-crema"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt=""
            width={786}
            height={800}
            className="h-20 w-20 object-contain"
          />
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
            {siteConfig.brandName}
          </p>
          <p className="mt-1.5 max-w-[40ch] text-sm text-crema/70">{siteConfig.tagline}</p>

          <div className="mt-6 text-oro-500">
            <OrnamentRule className="h-3 w-28" />
          </div>

          <nav
            aria-label="Contacto"
            className="mt-6 flex flex-col items-center gap-1 sm:flex-row sm:gap-2"
          >
            <a
              href={buildContactoLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`${itemBase} hover:bg-white/10 hover:text-white`}
            >
              <WhatsAppIcon className="h-[1.15rem] w-[1.15rem] text-oro-400" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>

            <a
              href={`https://instagram.com/${instagramUser}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${itemBase} hover:bg-white/10 hover:text-white`}
            >
              <InstagramIcon className="h-[1.15rem] w-[1.15rem] text-oro-400" />
              <span className="text-sm font-medium">{siteConfig.instagramHandle}</span>
            </a>

            <span className={itemBase}>
              <MapPinIcon className="h-[1.15rem] w-[1.15rem] text-oro-400" />
              <span className="text-sm font-medium">{siteConfig.city}</span>
            </span>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-crema/55">
            © {year} {siteConfig.brandName}. Hecho en Totoras, Santa Fe.
          </p>
        </div>
      </div>
    </footer>
  );
}
