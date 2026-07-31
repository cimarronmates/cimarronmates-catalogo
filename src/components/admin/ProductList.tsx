"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { Producto, Estado } from "@/lib/types";
import { getVisibleGrupos, getVisibleSueltas } from "@/lib/filters";

interface Props {
  productos: Producto[];
  onReorder: (categoria: string, orderedIds: string[]) => void;
  onToggleDestacado: (id: string) => void;
  onChangeEstado: (id: string, estado: Estado) => void;
  onEdit: (producto: Producto) => void;
  onDelete: (id: string) => void;
}

function Row({ producto, onToggleDestacado, onChangeEstado, onEdit, onDelete }: Omit<Props, "productos" | "onReorder"> & { producto: Producto }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: producto.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 border-b border-neutral-light bg-white p-3">
      <button {...attributes} {...listeners} className="cursor-grab px-1 text-neutral-mid" aria-label="Reordenar">
        ⠿
      </button>
      {producto.imagen_url ? (
        <Image src={producto.imagen_url} alt={producto.nombre} width={48} height={48} className="h-12 w-12 rounded object-cover" />
      ) : (
        <div className="h-12 w-12 rounded bg-marca-50" />
      )}
      <span className="flex-1 truncate">{producto.nombre}</span>
      <span className="w-20 text-right">${producto.precio.toLocaleString("es-AR")}</span>
      <button onClick={() => onToggleDestacado(producto.id)} aria-label="Destacado">
        {producto.destacado ? "⭐" : "☆"}
      </button>
      <select
        value={producto.estado}
        onChange={(e) => onChangeEstado(producto.id, e.target.value as Estado)}
        className="rounded border border-neutral-light px-2 py-1 text-sm"
      >
        <option value="Disponible">Disponible</option>
        <option value="Sin stock">Sin stock</option>
      </select>
      <button onClick={() => onEdit(producto)} className="text-sm text-marca-400">Editar</button>
      <button
        onClick={() => {
          if (confirm(`¿Eliminar "${producto.nombre}"?`)) onDelete(producto.id);
        }}
        className="text-sm text-red-600"
      >
        Eliminar
      </button>
    </div>
  );
}

export default function ProductList({ productos, onReorder, onToggleDestacado, onChangeEstado, onEdit, onDelete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));
  const grupos = getVisibleGrupos(productos);
  const sueltas = getVisibleSueltas(productos);

  function productosDe(categoria: string) {
    return productos
      .filter((p) => p.subcategoria === categoria)
      .sort((a, b) => a.orden_display - b.orden_display);
  }

  function handleDragEnd(categoria: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = productosDe(categoria);
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(categoria, reordered.map((p) => p.id));
  }

  const categoriasConProductos = [
    ...grupos.flatMap((g) => g.categorias),
    ...sueltas,
  ];

  return (
    <div className="flex flex-col gap-8 p-4">
      {categoriasConProductos.map((categoria) => {
        const items = productosDe(categoria);
        if (items.length === 0) return null;
        return (
          <div key={categoria}>
            <h3 className="mb-2 font-heading text-lg text-marca-700">{categoria}</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(categoria, e)}>
              <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {items.map((producto) => (
                  <Row
                    key={producto.id}
                    producto={producto}
                    onToggleDestacado={onToggleDestacado}
                    onChangeEstado={onChangeEstado}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
}
