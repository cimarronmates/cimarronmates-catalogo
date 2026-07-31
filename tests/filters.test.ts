import { describe, it, expect } from "vitest";
import {
  applyFilters,
  getInitialFilterState,
  getVisibleGrupos,
  getVisibleSueltas,
  getPriceBounds,
  type FilterState,
} from "@/lib/filters";
import type { Producto } from "@/lib/types";

function producto(overrides: Partial<Producto>): Producto {
  return {
    id: "1",
    nombre: "Mate Torpedo",
    descripcion_corta: null,
    imagen_url: null,
    categoria: "Mates",
    subcategoria: "Torpedo",
    estado: "Disponible",
    precio: 10000,
    destacado: false,
    orden_display: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("filters", () => {
  const productos = [
    producto({ id: "1", categoria: "Mates", subcategoria: "Torpedo", precio: 10000 }),
    producto({ id: "2", categoria: "Mates", subcategoria: "Camionero", precio: 20000, estado: "Sin stock" }),
    producto({ id: "3", categoria: "Bombillas", subcategoria: "Alpaca", precio: 16000 }),
    producto({ id: "4", categoria: "Yerbas", subcategoria: "Yerbas", precio: 3000 }),
  ];

  it("hides groups and subcategories with zero products", () => {
    const visibleGrupos = getVisibleGrupos(productos);
    expect(visibleGrupos).toEqual([
      { nombre: "Mates", categorias: ["Torpedo", "Camionero"] },
      { nombre: "Bombillas", categorias: ["Alpaca"] },
    ]);
  });

  it("hides loose categories with zero products", () => {
    expect(getVisibleSueltas(productos)).toEqual(["Yerbas"]);
  });

  it("computes dynamic price bounds", () => {
    expect(getPriceBounds(productos)).toEqual({ min: 3000, max: 20000 });
  });

  it("selecting a group with no subcategory shows all products in that group", () => {
    const filters: FilterState = { grupo: "Mates", categoria: null, soloDisponibles: false, precioMin: 0, precioMax: 999999 };
    const result = applyFilters(productos, filters);
    expect(result.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("selecting a subcategory narrows further", () => {
    const filters: FilterState = { grupo: "Mates", categoria: "Torpedo", soloDisponibles: false, precioMin: 0, precioMax: 999999 };
    expect(applyFilters(productos, filters).map((p) => p.id)).toEqual(["1"]);
  });

  it("Todos (grupo=null, categoria=null) returns everything within price/estado bounds", () => {
    const filters: FilterState = { grupo: null, categoria: null, soloDisponibles: false, precioMin: 0, precioMax: 999999 };
    expect(applyFilters(productos, filters)).toHaveLength(4);
  });

  it("soloDisponibles filters out Sin stock", () => {
    const filters: FilterState = { grupo: null, categoria: null, soloDisponibles: true, precioMin: 0, precioMax: 999999 };
    const result = applyFilters(productos, filters);
    expect(result.find((p) => p.id === "2")).toBeUndefined();
  });

  it("price range filters by precio inclusive bounds", () => {
    const filters: FilterState = { grupo: null, categoria: null, soloDisponibles: false, precioMin: 4000, precioMax: 15000 };
    expect(applyFilters(productos, filters).map((p) => p.id).sort()).toEqual(["1"]);
  });

  it("getInitialFilterState seeds precioMin/Max from data and clears grupo/categoria", () => {
    const state = getInitialFilterState(productos);
    expect(state).toEqual({ grupo: null, categoria: null, soloDisponibles: false, precioMin: 3000, precioMax: 20000 });
  });
});
