import ProductCard from "@/components/ProductCard";
import type { Producto } from "@/lib/types";
import { OrnamentRule } from "@/components/icons";

export default function Destacados({ productos }: { productos: Producto[] }) {
  if (productos.length === 0) return null;

  // Each card carries its own horizontal padding instead of a flex `gap`, so
  // the two halves are exactly equal in width and translateX(-50%) lands on a
  // seamless loop point rather than drifting by half a gap every cycle.
  const half = (
    <div className="flex">
      {productos.map((producto) => (
        <div key={producto.id} className="w-[15rem] shrink-0 px-2.5 sm:w-[16.5rem]">
          <ProductCard producto={producto} />
        </div>
      ))}
    </div>
  );

  return (
    <section id="destacados" className="border-y border-crema-hondo bg-crema">
      <div className="py-16 sm:py-20">
        <header className="mb-9 px-4 text-center sm:px-6">
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-marca-700">
            Destacados
          </h2>
          <div className="mt-3 flex justify-center text-oro-500">
            <OrnamentRule className="h-3 w-24" />
          </div>
          <p className="mx-auto mt-3 max-w-[44ch] text-balance text-sm text-tinta-suave sm:text-base">
            Los que más nos piden esta temporada.
          </p>
        </header>

        <div
          className="marquee-viewport relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, #000 4rem, #000 calc(100% - 4rem), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 4rem, #000 calc(100% - 4rem), transparent)",
          }}
        >
          <div className="marquee flex w-max">
            {half}
            <div className="marquee-dup flex" aria-hidden="true">
              {half}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
