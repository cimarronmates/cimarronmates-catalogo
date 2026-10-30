import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductCard from "@/components/ProductCard";
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
    precio: 15000,
    destacado: false,
    orden_display: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ProductCard price", () => {
  it("shows the price when the product is available", () => {
    render(<ProductCard producto={producto({})} />);
    expect(screen.getByText("15.000")).toBeTruthy();
    expect(screen.queryByText("Precio a consultar")).toBeNull();
  });

  it("shows 'Precio a consultar' instead of the price when out of stock", () => {
    render(<ProductCard producto={producto({ estado: "Sin stock" })} />);
    expect(screen.getByText("Precio a consultar")).toBeTruthy();
    expect(screen.queryByText("15.000")).toBeNull();
  });
});
