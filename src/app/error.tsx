"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-crema px-4 text-center">
      <Image
        src="/logo.png"
        alt=""
        width={786}
        height={800}
        className="h-20 w-20 object-contain opacity-70"
      />
      <div>
        <h1 className="font-display text-2xl font-semibold text-marca-700">Algo salió mal</h1>
        <p className="mx-auto mt-2 max-w-[44ch] text-tinta-suave">
          No pudimos cargar el catálogo en este momento. Probá de nuevo en unos segundos.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-[2.75rem] items-center rounded-xl bg-marca-400 px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-500"
      >
        Reintentar
      </button>
    </div>
  );
}
