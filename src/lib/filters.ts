import { GRUPOS, SUELTAS, type Grupo } from "@/lib/categories";
import type { Producto } from "@/lib/types";

export interface FilterState {
  grupo: string | null;
  categoria: string | null;
  soloDisponibles: boolean;
  precioMin: number;
  precioMax: number;
  busqueda: string;
}

// Sin stock products show "Precio a consultar", so their price must not shape the slider.
export function getPriceBounds(productos: Producto[]): { min: number; max: number } {
  const precios = productos.filter((p) => p.estado === "Disponible").map((p) => p.precio);
  if (precios.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...precios), max: Math.max(...precios) };
}

export function getInitialFilterState(productos: Producto[]): FilterState {
  const { min, max } = getPriceBounds(productos);
  return { grupo: null, categoria: null, soloDisponibles: false, precioMin: min, precioMax: max, busqueda: "" };
}

export function getVisibleGrupos(productos: Producto[]): Grupo[] {
  return GRUPOS.map((grupo) => ({
    nombre: grupo.nombre,
    categorias: grupo.categorias.filter((sub) =>
      productos.some((p) => p.categoria === grupo.nombre && p.subcategoria === sub)
    ),
  })).filter((grupo) => grupo.categorias.length > 0);
}

export function getVisibleSueltas(productos: Producto[]): string[] {
  return SUELTAS.filter((suelta) => productos.some((p) => p.categoria === suelta));
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function coincideBusqueda(p: Producto, palabras: string[]): boolean {
  if (palabras.length === 0) return true;
  const texto = normalizar(
    [p.nombre, p.descripcion_corta, p.categoria, p.subcategoria].filter(Boolean).join(" ")
  );
  return palabras.every((palabra) => texto.includes(palabra));
}

export function applyFilters(productos: Producto[], filters: FilterState): Producto[] {
  const palabras = normalizar(filters.busqueda).split(/\s+/).filter(Boolean);
  const filtrados = productos.filter((p) => {
    if (!coincideBusqueda(p, palabras)) return false;
    if (filters.grupo && p.categoria !== filters.grupo) return false;
    if (filters.categoria && p.subcategoria !== filters.categoria) return false;
    if (filters.soloDisponibles && p.estado !== "Disponible") return false;
    if (p.estado === "Disponible" && (p.precio < filters.precioMin || p.precio > filters.precioMax)) {
      return false;
    }
    return true;
  });
  // Available first; each group keeps the order it came in.
  return [
    ...filtrados.filter((p) => p.estado === "Disponible"),
    ...filtrados.filter((p) => p.estado !== "Disponible"),
  ];
}
