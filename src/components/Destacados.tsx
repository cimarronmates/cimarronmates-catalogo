import ProductCard from "@/components/ProductCard";
import type { Producto } from "@/lib/types";

export default function Destacados({ productos }: { productos: Producto[] }) {
  if (productos.length === 0) return null;

  const track = [...productos, ...productos];

  return (
    <section id="destacados" className="overflow-hidden bg-marca-cream py-16">
      <h2 className="mb-8 text-center font-heading text-3xl text-marca-700">Destacados</h2>
      <div className="marquee flex w-max gap-4 px-4">
        {track.map((producto, i) => (
          <div key={`${producto.id}-${i}`} className="w-64 shrink-0">
            <ProductCard producto={producto} />
          </div>
        ))}
      </div>
    </section>
  );
}
