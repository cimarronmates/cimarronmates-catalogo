"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-marca-cream px-4 text-center">
      <h1 className="font-heading text-2xl text-marca-700">Algo salió mal</h1>
      <p className="text-neutral-mid">No pudimos cargar el catálogo en este momento.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-marca-400 px-4 py-2 text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
