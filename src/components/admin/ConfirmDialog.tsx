"use client";

import Modal from "@/components/admin/Modal";
import { AlertIcon } from "@/components/icons";

interface Props {
  open: boolean;
  titulo: string;
  detalle?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  titulo,
  detalle,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-titulo">
      <div className="w-[min(100vw-2rem,26rem)] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex gap-4">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alerta-suave text-alerta">
            <AlertIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-titulo" className="font-display text-lg font-semibold text-tinta">
              {titulo}
            </h2>
            {detalle && <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{detalle}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg px-4 text-sm font-medium text-tinta-suave transition-colors hover:bg-marca-50 hover:text-tinta"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg bg-alerta px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
