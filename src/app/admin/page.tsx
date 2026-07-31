"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Producto, Estado } from "@/lib/types";
import ProductList from "@/components/admin/ProductList";
import ProductFormModal from "@/components/admin/ProductFormModal";

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editing, setEditing] = useState<Producto | null | "new">(null);
  const supabase = createBrowserClient();

  async function reload() {
    const { data } = await supabase.from("productos").select("*").order("orden_display", { ascending: true });
    setProductos((data as Producto[]) ?? []);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleReorder(categoria: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => supabase.from("productos").update({ orden_display: index }).eq("id", id))
    );
    reload();
  }

  async function handleToggleDestacado(id: string) {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    await supabase.from("productos").update({ destacado: !producto.destacado }).eq("id", id);
    reload();
  }

  async function handleChangeEstado(id: string, estado: Estado) {
    await supabase.from("productos").update({ estado }).eq("id", id);
    reload();
  }

  async function handleDelete(id: string) {
    await supabase.from("productos").delete().eq("id", id);
    reload();
  }

  return (
    <main>
      <div className="flex items-center justify-between p-4">
        <h1 className="font-heading text-2xl text-marca-700">Productos</h1>
        <button onClick={() => setEditing("new")} className="rounded-lg bg-marca-400 px-4 py-2 text-white">
          Nuevo producto
        </button>
      </div>

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
