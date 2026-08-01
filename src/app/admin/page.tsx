"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Estado, Producto } from "@/lib/types";
import ProductList from "@/components/admin/ProductList";
import ProductFormModal from "@/components/admin/ProductFormModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { AlertIcon, LogOutIcon, PlusIcon, XIcon } from "@/components/icons";
import { siteConfig } from "@/lib/config";

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editing, setEditing] = useState<Producto | null | "new">(null);
  const [porEliminar, setPorEliminar] = useState<Producto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();

  const fetchProductosQuery = useCallback(
    () => supabase.from("productos").select("*").order("orden_display", { ascending: true }),
    [supabase]
  );

  const reload = useCallback(async () => {
    const { data, error: reloadError } = await fetchProductosQuery();
    if (reloadError) {
      setError("No se pudieron cargar los productos.");
      return;
    }
    setProductos((data as Producto[]) ?? []);
  }, [fetchProductosQuery]);

  // Fetch-on-mount runs as a plain promise chain (rather than calling `reload`
  // directly) so the setState calls stay out of the effect's own call graph.
  useEffect(() => {
    fetchProductosQuery().then(({ data, error: reloadError }) => {
      if (reloadError) setError("No se pudieron cargar los productos.");
      else setProductos((data as Producto[]) ?? []);
      setCargando(false);
    });
  }, [fetchProductosQuery]);

  async function handleReorder(categoria: string, orderedIds: string[]) {
    setError(null);
    // Reuse the slots this category already occupies instead of renumbering
    // from zero, so reordering here can't collide with another category's
    // values in the shared `orden_display` column.
    const currentSlots = productos
      .filter((p) => p.subcategoria === categoria)
      .map((p) => p.orden_display)
      .sort((a, b) => a - b);

    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("productos").update({ orden_display: currentSlots[index] }).eq("id", id)
      )
    );
    if (results.some((r) => r.error)) setError("No se pudo guardar el nuevo orden.");
    reload();
  }

  async function handleToggleDestacado(id: string) {
    setError(null);
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    const { error: toggleError } = await supabase
      .from("productos")
      .update({ destacado: !producto.destacado })
      .eq("id", id);
    if (toggleError) setError("No se pudo actualizar el destacado.");
    reload();
  }

  async function handleChangeEstado(id: string, estado: Estado) {
    setError(null);
    const { error: estadoError } = await supabase.from("productos").update({ estado }).eq("id", id);
    if (estadoError) setError("No se pudo actualizar el estado.");
    reload();
  }

  async function confirmarEliminar() {
    if (!porEliminar) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from("productos")
      .delete()
      .eq("id", porEliminar.id);
    if (deleteError) setError("No se pudo eliminar el producto.");
    setPorEliminar(null);
    reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-linea bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={786}
              height={800}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold leading-tight text-marca-700">
                {siteConfig.brandName}
              </p>
              <p className="text-xs leading-tight text-tinta-suave">Panel de productos</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-tinta-suave transition-colors hover:bg-marca-50 hover:text-marca-700 sm:inline-flex"
            >
              Ver sitio
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg px-3 text-sm font-medium text-tinta-suave transition-colors hover:bg-marca-50 hover:text-marca-700"
            >
              <LogOutIcon className="h-[1.15rem] w-[1.15rem]" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-marca-700">Productos</h1>
            <p className="mt-0.5 text-sm text-tinta-suave">
              {cargando
                ? "Cargando…"
                : `${productos.length} ${productos.length === 1 ? "producto" : "productos"} en el catálogo`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-marca-400 px-4 text-sm font-semibold text-white transition-colors hover:bg-marca-500"
          >
            <PlusIcon className="h-[1.15rem] w-[1.15rem]" />
            Nuevo producto
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl bg-alerta-suave px-4 py-3 text-sm text-alerta"
          >
            <span className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Cerrar aviso"
              className="-m-1 shrink-0 rounded p-1 text-alerta transition-opacity hover:opacity-70"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {cargando ? (
          <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando productos">
            {[0, 1, 2, 3].map((i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-linea bg-white p-2.5"
              >
                <span className="h-12 w-12 animate-pulse rounded-lg bg-marca-50 sm:h-14 sm:w-14" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3.5 w-2/5 animate-pulse rounded bg-marca-50" />
                  <span className="block h-3 w-20 animate-pulse rounded bg-marca-50" />
                </span>
              </li>
            ))}
          </ul>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-linea-fuerte bg-white px-6 py-16 text-center">
            <Image
              src="/logo.png"
              alt=""
              width={786}
              height={800}
              className="h-16 w-16 object-contain opacity-40"
            />
            <div>
              <p className="font-display text-lg font-semibold text-marca-700">
                Todavía no cargaste ningún producto
              </p>
              <p className="mx-auto mt-1 max-w-[44ch] text-sm text-tinta-suave">
                Cargá el primero y va a aparecer en el catálogo del sitio al instante. Las
                categorías vacías no se muestran.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="mt-1 inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-marca-400 px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-500"
            >
              <PlusIcon className="h-[1.15rem] w-[1.15rem]" />
              Cargar primer producto
            </button>
          </div>
        ) : (
          <ProductList
            productos={productos}
            onReorder={handleReorder}
            onToggleDestacado={handleToggleDestacado}
            onChangeEstado={handleChangeEstado}
            onEdit={(producto) => setEditing(producto)}
            onDelete={(producto) => setPorEliminar(producto)}
          />
        )}
      </main>

      {editing && (
        <ProductFormModal
          producto={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={porEliminar !== null}
        titulo={`¿Eliminar "${porEliminar?.nombre ?? ""}"?`}
        detalle="Se borra del catálogo del sitio en el acto. No se puede deshacer."
        onConfirm={confirmarEliminar}
        onCancel={() => setPorEliminar(null)}
      />
    </>
  );
}
