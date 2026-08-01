"use client";

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

/**
 * Thin wrapper over the native <dialog> element.
 *
 * `showModal()` hands us the focus trap, Escape-to-close, background inerting
 * and top-layer rendering that a hand-rolled div modal would have to
 * reimplement (and usually gets wrong).
 */
export default function Modal({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();

    // A native dialog doesn't stop the page behind it from scrolling, which
    // on mobile lets the background drift while the form is open.
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";

    return () => {
      document.body.style.overflow = "";
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click that lands on the dialog element itself is a backdrop click;
      // clicks on the panel below stop at the panel.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
