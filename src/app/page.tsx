import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Destacados from "@/components/Destacados";
import Catalogo from "@/components/Catalogo";
import Footer from "@/components/Footer";
import { fetchProductos } from "@/lib/products";

export const revalidate = 0;

export default async function Home() {
  const productos = await fetchProductos();
  const destacados = productos.filter((p) => p.destacado);

  return (
    <main>
      <Navbar />
      <Hero />
      <Destacados productos={destacados} />
      <Catalogo productos={productos} />
      <Footer />
    </main>
  );
}
