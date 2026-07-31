"use client";

import type { Producto } from "@/lib/types";

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductFormModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <p className="text-sm text-neutral-mid">Formulario de producto (pendiente — Task 19)</p>
        <button type="button" onClick={onClose} className="mt-4 rounded-lg px-4 py-2 text-marca-700">
          Cerrar
        </button>
      </div>
    </div>
  );
}
