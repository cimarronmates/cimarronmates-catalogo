import { GRUPOS, SUELTAS, type Grupo } from "@/lib/categories";
import type { Producto } from "@/lib/types";

export interface FilterState {
  grupo: string | null;
  categoria: string | null;
  soloDisponibles: boolean;
  precioMin: number;
  precioMax: number;
}

// Sin stock products show "Precio a consultar", so their price must not shape the slider.
export function getPriceBounds(productos: Producto[]): { min: number; max: number } {
  const precios = productos.filter((p) => p.estado === "Disponible").map((p) => p.precio);
  if (precios.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...precios), max: Math.max(...precios) };
}

export function getInitialFilterState(productos: Producto[]): FilterState {
  const { min, max } = getPriceBounds(productos);
  return { grupo: null, categoria: null, soloDisponibles: false, precioMin: min, precioMax: max };
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

export function applyFilters(productos: Producto[], filters: FilterState): Producto[] {
  return productos.filter((p) => {
    if (filters.grupo && p.categoria !== filters.grupo) return false;
    if (filters.categoria && p.subcategoria !== filters.categoria) return false;
    if (filters.soloDisponibles && p.estado !== "Disponible") return false;
    if (p.estado === "Disponible" && (p.precio < filters.precioMin || p.precio > filters.precioMax)) {
      return false;
    }
    return true;
  });
}
