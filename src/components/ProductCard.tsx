import Image from "next/image";
import type { Producto } from "@/lib/types";
import { buildConsultaLink } from "@/lib/whatsapp";
import { ImageIcon, WhatsAppIcon } from "@/components/icons";

export default function ProductCard({ producto }: { producto: Producto }) {
  const disponible = producto.estado === "Disponible";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-linea bg-white transition-all duration-300 hover:-translate-y-1 hover:border-linea-fuerte hover:shadow-[0_16px_40px_-18px_rgba(28,36,25,0.35)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-marca-50">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] ${
              disponible ? "" : "opacity-75 saturate-50"
            }`}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-marca-400">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

        <span
          className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold leading-none tracking-wide shadow-sm ${
            disponible ? "bg-exito text-white" : "bg-alerta text-white"
          }`}
        >
          {producto.estado}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h3 className="font-display text-[1.0625rem] font-semibold leading-snug text-marca-700">
            {producto.nombre}
          </h3>

          {producto.descripcion_corta && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tinta-suave">
              {producto.descripcion_corta}
            </p>
          )}
        </div>

        <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-marca-700">
          <span className="text-base font-medium text-tinta-suave">$</span>
          {producto.precio.toLocaleString("es-AR")}
        </p>

        <a
          href={buildConsultaLink(producto)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-marca-400 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-marca-500"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Consultar
        </a>
      </div>
    </article>
  );
}
