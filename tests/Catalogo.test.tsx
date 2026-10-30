import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Catalogo from "@/components/Catalogo";
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

const productos = [
  producto({ id: "1", nombre: "Mate Torpedo Cuero" }),
  producto({ id: "2", nombre: "Termo Stanley", categoria: "Termos/Vasos", subcategoria: "Termos/Vasos", precio: 90000 }),
];

describe("Catalogo búsqueda", () => {
  it("filters the grid as the user types and shows the count", async () => {
    render(<Catalogo productos={productos} />);
    expect(screen.getByText("Mate Torpedo Cuero")).toBeTruthy();
    expect(screen.getByText("Termo Stanley")).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar productos" }), {
      target: { value: "termo" },
    });

    await waitFor(() => expect(screen.queryByText("Mate Torpedo Cuero")).toBeNull());
    expect(screen.getByText("Termo Stanley")).toBeTruthy();
    expect(screen.getByText("1 de 2")).toBeTruthy();
  });

  it("clears the search with the clear button", async () => {
    render(<Catalogo productos={productos} />);
    const input = screen.getByRole("searchbox", { name: "Buscar productos" }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "termo" } });
    fireEvent.click(await screen.findByRole("button", { name: "Borrar búsqueda" }));

    expect(input.value).toBe("");
    await waitFor(() => expect(screen.getByText("Mate Torpedo Cuero")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Borrar búsqueda" })).toBeNull();
  });

  it("shows the empty state when nothing matches, and 'Limpiar filtros' resets the search", async () => {
    render(<Catalogo productos={productos} />);
    const input = screen.getByRole("searchbox", { name: "Buscar productos" }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(await screen.findByText("No encontramos nada con esos filtros")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Limpiar filtros" })[0]);

    expect(input.value).toBe("");
    await waitFor(() => expect(screen.getByText("Mate Torpedo Cuero")).toBeTruthy());
  });
});
