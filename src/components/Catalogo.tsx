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
import { buildContactoLink } from "@/lib/whatsapp";
import {
  ChevronDownIcon,
  OrnamentRule,
  SearchIcon,
  SearchOffIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/icons";

const chipBase =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors duration-200";
const chipOff = "bg-marca-50 text-marca-700 hover:bg-marca-100";
const chipOn = "bg-marca-400 text-white hover:bg-marca-500";

export default function Catalogo({ productos }: { productos: Producto[] }) {
  const [filters, setFilters] = useState<FilterState>(() => getInitialFilterState(productos));

  const grupos = useMemo(() => getVisibleGrupos(productos), [productos]);
  const sueltas = useMemo(() => getVisibleSueltas(productos), [productos]);
  const bounds = useMemo(() => getPriceBounds(productos), [productos]);
  const visibles = useMemo(() => applyFilters(productos, filters), [productos, filters]);

  const sinFiltrar =
    !filters.grupo &&
    !filters.categoria &&
    !filters.soloDisponibles &&
    !filters.busqueda &&
    filters.precioMin === bounds.min &&
    filters.precioMax === bounds.max;

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
    <section id="catalogo" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <header className="mb-10 text-center">
          <h2 className="font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em] text-marca-700">
            Catálogo
          </h2>
          <div className="mt-3 flex justify-center text-oro-500">
            <OrnamentRule className="h-3 w-24" />
          </div>
          <p className="mx-auto mt-4 max-w-[46ch] text-balance text-tinta-suave">
            Elegí lo que buscás y consultanos.
          </p>
        </header>

        {/* Nothing published yet: a filter bar over an empty catalog is just
            noise, so the section becomes a single honest invitation. */}
        {productos.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-dashed border-linea-fuerte bg-crema/40 px-6 py-14 text-center">
            <SearchOffIcon className="h-9 w-9 text-marca-400" />
            <div>
              <p className="font-display text-lg font-semibold text-marca-700">
                Estamos cargando el catálogo
              </p>
              <p className="mx-auto mt-1.5 max-w-[42ch] text-sm leading-relaxed text-tinta-suave">
                Todavía no publicamos los productos acá. Escribinos y te contamos al toque qué
                tenemos disponible.
              </p>
            </div>
            <a
              href={buildContactoLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-marca-400 px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-500"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          </div>
        ) : (
          <>
        {/* --- Filters ---------------------------------------------------- */}
        <div className="rounded-2xl border border-linea bg-crema/45 p-4 sm:p-5">
          <div className="relative mb-4">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-suave" />
            <input
              type="search"
              value={filters.busqueda}
              onChange={(e) => setFilters((f) => ({ ...f, busqueda: e.target.value }))}
              placeholder="Buscar mates, bombillas, termos…"
              aria-label="Buscar productos"
              autoComplete="off"
              className="min-h-11 w-full rounded-xl border border-linea-fuerte bg-white py-2 pl-11 pr-11 text-base text-tinta placeholder:text-tinta-suave/70 focus:border-marca-400 focus:outline-none focus:ring-2 focus:ring-marca-400/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.busqueda && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, busqueda: "" }))}
                aria-label="Borrar búsqueda"
                className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-tinta-suave transition-colors hover:text-marca-700"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectTodos}
              aria-pressed={!filters.grupo && !filters.categoria}
              className={`${chipBase} ${!filters.grupo && !filters.categoria ? chipOn : chipOff}`}
            >
              Todos
            </button>

            <span aria-hidden className="mx-1 hidden h-6 w-px bg-linea-fuerte sm:block" />

            {grupos.map((grupo) => {
              const activo = filters.grupo === grupo.nombre;
              return (
                <button
                  key={grupo.nombre}
                  type="button"
                  onClick={() => selectGrupo(grupo.nombre)}
                  aria-pressed={activo}
                  aria-expanded={activo}
                  className={`${chipBase} ${activo ? chipOn : chipOff}`}
                >
                  {grupo.nombre}
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      activo ? "rotate-180" : ""
                    }`}
                  />
                </button>
              );
            })}

            {sueltas.map((suelta) => {
              const activo = filters.grupo === suelta;
              return (
                <button
                  key={suelta}
                  type="button"
                  onClick={() => selectGrupo(suelta)}
                  aria-pressed={activo}
                  className={`${chipBase} ${activo ? chipOn : chipOff}`}
                >
                  {suelta}
                </button>
              );
            })}
          </div>

          {/* Subcategories of the open group */}
          <AnimatePresence initial={false}>
            {grupos.map((grupo) =>
              filters.grupo === grupo.nombre ? (
                <motion.div
                  key={grupo.nombre}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-linea pt-3">
                    {grupo.categorias.map((sub) => {
                      const activa = filters.categoria === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => selectCategoria(sub)}
                          aria-pressed={activa}
                          className={`inline-flex min-h-10 items-center rounded-lg px-3.5 text-[0.8125rem] font-medium transition-colors duration-200 ${
                            activa
                              ? "bg-oro-500 text-marca-900"
                              : "bg-white text-marca-700 ring-1 ring-inset ring-linea hover:ring-linea-fuerte"
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-col gap-4 border-t border-linea pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <PriceRangeSlider
              min={bounds.min}
              max={bounds.max}
              value={[filters.precioMin, filters.precioMax]}
              onChange={([precioMin, precioMax]) =>
                setFilters((f) => ({ ...f, precioMin, precioMax }))
              }
            />

            <label className="inline-flex min-h-[2.75rem] cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-tinta sm:min-h-0">
              <input
                type="checkbox"
                checked={filters.soloDisponibles}
                onChange={(e) => setFilters((f) => ({ ...f, soloDisponibles: e.target.checked }))}
                className="h-[1.15rem] w-[1.15rem] rounded border-linea-fuerte accent-marca-400"
              />
              Solo disponibles
            </label>
          </div>
        </div>

        {/* --- Result count ----------------------------------------------- */}
        <div className="mb-6 mt-6 flex items-center justify-between gap-4">
          <p aria-live="polite" className="text-sm text-tinta-suave">
            {visibles.length === productos.length
              ? `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`
              : `${visibles.length} de ${productos.length}`}
          </p>
          {!sinFiltrar && (
            <button
              type="button"
              onClick={() => setFilters(getInitialFilterState(productos))}
              className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-marca-400 underline-offset-4 transition-colors hover:text-marca-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* --- Grid --------------------------------------------------------- */}
        {visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-linea-fuerte px-6 py-16 text-center">
            <SearchOffIcon className="h-9 w-9 text-marca-300" />
            <div>
              <p className="font-display text-lg font-semibold text-marca-700">
                No encontramos nada con esos filtros
              </p>
              <p className="mx-auto mt-1 max-w-[42ch] text-sm text-tinta-suave">
                Probá con otra palabra, ampliar el rango de precio o volver a ver todas las categorías.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilters(getInitialFilterState(productos))}
              className="mt-1 inline-flex min-h-[2.75rem] items-center rounded-xl bg-marca-400 px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-500"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visibles.map((producto) => (
                <motion.div
                  key={producto.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard producto={producto} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
          </>
        )}
      </div>
    </section>
  );
}
