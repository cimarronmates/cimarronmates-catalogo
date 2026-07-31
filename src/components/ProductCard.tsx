import Image from "next/image";
import type { Producto } from "@/lib/types";
import { buildConsultaLink } from "@/lib/whatsapp";

export default function ProductCard({ producto }: { producto: Producto }) {
  const disponible = producto.estado === "Disponible";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative aspect-[4/5] w-full">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-marca-50 text-marca-700">Sin imagen</div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold text-white ${
            disponible ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {producto.estado}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-lg text-marca-700">{producto.nombre}</h3>
        {producto.descripcion_corta && <p className="text-sm text-neutral-mid">{producto.descripcion_corta}</p>}
        <p className="mt-2 text-xl font-bold text-marca-700">${producto.precio.toLocaleString("es-AR")}</p>
        <a
          href={buildConsultaLink(producto)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-lg bg-marca-400 px-4 py-2 text-center text-white transition hover:bg-marca-500"
        >
          Consultar
        </a>
      </div>
    </article>
  );
}
