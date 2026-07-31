"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Producto, Estado } from "@/lib/types";
import ProductList from "@/components/admin/ProductList";
import ProductFormModal from "@/components/admin/ProductFormModal";

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editing, setEditing] = useState<Producto | null | "new">(null);
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
      if (reloadError) {
        setError("No se pudieron cargar los productos.");
        return;
      }
      setProductos((data as Producto[]) ?? []);
    });
  }, [fetchProductosQuery]);

  async function handleReorder(categoria: string, orderedIds: string[]) {
    const currentSlots = productos
      .filter((p) => p.subcategoria === categoria)
      .map((p) => p.orden_display)
      .sort((a, b) => a - b);

    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("productos").update({ orden_display: currentSlots[index] }).eq("id", id)
      )
    );
    if (results.some((r) => r.error)) {
      setError("No se pudo guardar el nuevo orden.");
    }
    reload();
  }

  async function handleToggleDestacado(id: string) {
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
    const { error: estadoError } = await supabase.from("productos").update({ estado }).eq("id", id);
    if (estadoError) setError("No se pudo actualizar el estado.");
    reload();
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("productos").delete().eq("id", id);
    if (deleteError) setError("No se pudo eliminar el producto.");
    reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main>
      <div className="flex items-center justify-between p-4">
        <h1 className="font-heading text-2xl text-marca-700">Productos</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing("new")} className="rounded-lg bg-marca-400 px-4 py-2 text-white">
            Nuevo producto
          </button>
          <button onClick={handleLogout} className="rounded-lg px-4 py-2 text-neutral-mid">
            Cerrar sesión
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar aviso" className="text-red-600">
            ✕
          </button>
        </div>
      )}

      <ProductList
        productos={productos}
        onReorder={handleReorder}
        onToggleDestacado={handleToggleDestacado}
        onChangeEstado={handleChangeEstado}
        onEdit={(producto) => setEditing(producto)}
        onDelete={handleDelete}
      />

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
    </main>
  );
}
