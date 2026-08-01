"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { Estado, Producto } from "@/lib/types";
import { getVisibleGrupos, getVisibleSueltas } from "@/lib/filters";
import { GripIcon, ImageIcon, PencilIcon, StarIcon, TrashIcon } from "@/components/icons";

interface Props {
  productos: Producto[];
  onReorder: (categoria: string, orderedIds: string[]) => void;
  onToggleDestacado: (id: string) => void;
  onChangeEstado: (id: string, estado: Estado) => void;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
}

type RowProps = Omit<Props, "productos" | "onReorder"> & { producto: Producto };

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-tinta-suave transition-colors hover:bg-marca-50 hover:text-marca-700";

// dnd-kit ships English screen-reader copy; this panel is Spanish.
const accesibilidad = {
  screenReaderInstructions: {
    draggable:
      "Para levantar el producto, presioná la barra espaciadora. Usá las flechas para moverlo, espacio para soltarlo y Escape para cancelar.",
  },
  announcements: {
    onDragStart: ({ active }: { active: { id: string | number } }) =>
      `Levantaste el producto ${active.id}.`,
    onDragOver: () => undefined,
    onDragEnd: () => "Producto soltado. Se guardó el nuevo orden.",
    onDragCancel: () => "Movimiento cancelado.",
  },
};

function Row({ producto, onToggleDestacado, onChangeEstado, onEdit, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: producto.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-2 rounded-xl border bg-white p-2.5 sm:grid-cols-[auto_auto_1fr_auto] ${
        isDragging
          ? "z-10 border-marca-300 shadow-lg"
          : "border-linea hover:border-linea-fuerte"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${producto.nombre}`}
        className="inline-flex h-9 w-7 cursor-grab touch-none items-center justify-center rounded-md text-linea-fuerte transition-colors hover:text-tinta-suave active:cursor-grabbing"
      >
        <GripIcon className="h-5 w-5" />
      </button>

      {producto.imagen_url ? (
        <Image
          src={producto.imagen_url}
          alt=""
          width={56}
          height={56}
          className="h-12 w-12 rounded-lg object-cover sm:h-14 sm:w-14"
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-marca-50 text-marca-400 sm:h-14 sm:w-14">
          <ImageIcon className="h-5 w-5" />
        </span>
      )}

      <div className="min-w-0">
        <p className="truncate font-medium leading-snug text-tinta">{producto.nombre}</p>
        <p className="mt-0.5 text-sm tabular-nums text-tinta-suave">
          ${producto.precio.toLocaleString("es-AR")}
        </p>
      </div>

      <div className="col-span-full flex flex-wrap items-center justify-end gap-1 border-t border-linea pt-2 sm:col-span-1 sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={() => onToggleDestacado(producto.id)}
          aria-pressed={producto.destacado}
          aria-label={
            producto.destacado
              ? `Quitar ${producto.nombre} de destacados`
              : `Destacar ${producto.nombre}`
          }
          title={producto.destacado ? "Quitar de destacados" : "Destacar"}
          className={`${iconBtn} ${producto.destacado ? "text-oro-500 hover:text-oro-600" : ""}`}
        >
          <StarIcon filled={producto.destacado} className="h-[1.15rem] w-[1.15rem]" />
        </button>

        <label className="sr-only" htmlFor={`estado-${producto.id}`}>
          Estado de {producto.nombre}
        </label>
        <select
          id={`estado-${producto.id}`}
          value={producto.estado}
          onChange={(e) => onChangeEstado(producto.id, e.target.value as Estado)}
          className={`h-9 rounded-lg border px-2 text-sm font-medium transition-colors ${
            producto.estado === "Disponible"
              ? "border-exito/30 bg-exito-suave text-exito"
              : "border-alerta/25 bg-alerta-suave text-alerta"
          }`}
        >
          <option value="Disponible">Disponible</option>
          <option value="Sin stock">Sin stock</option>
        </select>

        <button
          type="button"
          onClick={() => onEdit(producto)}
          aria-label={`Editar ${producto.nombre}`}
          title="Editar"
          className={iconBtn}
        >
          <PencilIcon className="h-[1.15rem] w-[1.15rem]" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(producto)}
          aria-label={`Eliminar ${producto.nombre}`}
          title="Eliminar"
          className={`${iconBtn} hover:bg-alerta-suave hover:text-alerta`}
        >
          <TrashIcon className="h-[1.15rem] w-[1.15rem]" />
        </button>
      </div>
    </li>
  );
}

export default function ProductList({
  productos,
  onReorder,
  onToggleDestacado,
  onChangeEstado,
  onEdit,
  onDelete,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grupos = getVisibleGrupos(productos);
  const sueltas = getVisibleSueltas(productos);

  // Grouped by `subcategoria` for both grupo children and sueltas: the form
  // mirrors `subcategoria = categoria` when saving a suelta, so one key works
  // for every row.
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
    onReorder(
      categoria,
      reordered.map((p) => p.id)
    );
  }

  const categorias = [...grupos.flatMap((g) => g.categorias), ...sueltas];

  return (
    <div className="flex flex-col gap-8">
      {categorias.map((categoria) => {
        const items = productosDe(categoria);
        if (items.length === 0) return null;
        return (
          <section key={categoria}>
            <h2 className="mb-3 flex items-baseline gap-2 font-display text-lg font-semibold text-marca-700">
              {categoria}
              <span className="text-sm font-normal tabular-nums text-tinta-suave">
                {items.length}
              </span>
            </h2>
            {/* A stable id per context: without it dnd-kit allocates its
                aria-describedby ids from a global counter that runs in a
                different order on the server than on the client, which
                hydrates mismatched. */}
            <DndContext
              id={`dnd-${categoria}`}
              sensors={sensors}
              collisionDetection={closestCenter}
              accessibility={accesibilidad}
              onDragEnd={(e) => handleDragEnd(categoria, e)}
            >
              <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-2">
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
                </ul>
              </SortableContext>
            </DndContext>
          </section>
        );
      })}
    </div>
  );
}
