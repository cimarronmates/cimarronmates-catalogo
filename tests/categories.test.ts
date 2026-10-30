import { describe, it, expect } from "vitest";
import { GRUPOS, SUELTAS } from "@/lib/categories";

describe("categories", () => {
  it("has the Mates and Bombillas groups with their subcategories", () => {
    expect(GRUPOS).toEqual([
      { nombre: "Mates", categorias: ["Torpedo", "Camionero", "Imperial", "Criollo", "Ranchero", "Algarrobo"] },
      { nombre: "Bombillas", categorias: ["Alpaca", "Acero"] },
    ]);
  });

  it("has the confirmed loose categories", () => {
    expect(SUELTAS).toEqual(["Termos/Vasos", "Yerbas", "Yerberas", "Materas", "Combos", "Set Asado", "Accesorios"]);
  });
});
