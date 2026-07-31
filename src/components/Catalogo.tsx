"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Producto } from "@/lib/types";
import {
  applyFilters,
  getInitialFilterState,
  getPriceBounds,
  getVisibleGrupos,
  getVisibleSueltas,
  type FilterState,
} from "@/lib/filters";
import ProductCard from "@/components/ProductCard";
import PriceRangeSlider from "@/components/PriceRangeSlider";

export default function Catalogo({ productos }: { productos: Producto[] }) {
  const [filters, setFilters] = useState<FilterState>(() => getInitialFilterState(productos));

  const grupos = useMemo(() => getVisibleGrupos(productos), [productos]);
  const sueltas = useMemo(() => getVisibleSueltas(productos), [productos]);
  const bounds = useMemo(() => getPriceBounds(productos), [productos]);
  const visibles = useMemo(() => applyFilters(productos, filters), [productos, filters]);

  function selectTodos() {
    setFilters((f) => ({ ...f, grupo: null, categoria: null }));
  }

  function selectGrupo(nombre: string) {
    // Reset categoria in the same call that sets grupo — avoids the batching
    // race described in spec §10 where a nested update could clobber this one.
    setFilters((f) => ({ ...f, grupo: f.grupo === nombre ? null : nombre, categoria: null }));
  }

  function selectCategoria(nombre: string) {
    setFilters((f) => ({ ...f, categoria: f.categoria === nombre ? null : nombre }));
  }

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-8 font-heading text-3xl text-marca-700">Catálogo</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={selectTodos}
          className={`rounded-full px-4 py-2 text-sm ${
            !filters.grupo && !filters.categoria ? "bg-marca-400 text-white" : "bg-marca-50 text-marca-700"
          }`}
        >
          Todos
        </button>

        {grupos.map((grupo) => (
          <div key={grupo.nombre} className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => selectGrupo(grupo.nombre)}
              className={`rounded-full px-4 py-2 text-sm ${
                filters.grupo === grupo.nombre ? "bg-marca-400 text-white" : "bg-marca-50 text-marca-700"
              }`}
            >
              {grupo.nombre}
            </button>
            {filters.grupo === grupo.nombre &&
              grupo.categorias.map((sub) => (
                <button
                  key={sub}
                  onClick={() => selectCategoria(sub)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    filters.categoria === sub ? "bg-marca-blush text-marca-700" : "bg-marca-cream text-marca-700"
                  }`}
                >
                  {sub}
                </button>
              ))}
          </div>
        ))}

        {sueltas.map((suelta) => (
          <button
            key={suelta}
            onClick={() => selectGrupo(suelta)}
            className={`rounded-full px-4 py-2 text-sm ${
              filters.grupo === suelta ? "bg-marca-400 text-white" : "bg-marca-50 text-marca-700"
            }`}
          >
            {suelta}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PriceRangeSlider
          min={bounds.min}
          max={bounds.max}
          value={[filters.precioMin, filters.precioMax]}
          onChange={([precioMin, precioMax]) => setFilters((f) => ({ ...f, precioMin, precioMax }))}
        />
        <label className="flex items-center gap-2 text-sm text-marca-700">
          <input
            type="checkbox"
            checked={filters.soloDisponibles}
            onChange={(e) => setFilters((f) => ({ ...f, soloDisponibles: e.target.checked }))}
          />
          Solo disponibles
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="py-12 text-center text-neutral-mid">No hay productos que coincidan con los filtros elegidos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visibles.map((producto) => (
              <motion.div
                key={producto.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ProductCard producto={producto} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
