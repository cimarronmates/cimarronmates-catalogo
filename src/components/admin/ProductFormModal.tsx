"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { compressToWebp } from "@/lib/image-compress";
import { GRUPOS, SUELTAS } from "@/lib/categories";
import type { Estado, Producto } from "@/lib/types";
import Modal from "@/components/admin/Modal";
import { AlertIcon, ImageIcon, UploadIcon, XIcon } from "@/components/icons";

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onSaved: () => void;
}

const DESCRIPCION_MAX = 150;

const label = "text-sm font-medium text-tinta";
const field =
  "w-full rounded-lg border border-linea-fuerte bg-white px-3 py-2.5 text-[0.9375rem] text-tinta transition-colors placeholder:text-tinta-suave/70 hover:border-marca-300 focus:border-marca-400";

export default function ProductFormModal({ producto, onClose, onSaved }: Props) {
  const supabase = createBrowserClient();

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion_corta ?? "");
  const [precio, setPrecio] = useState<string>(producto ? String(producto.precio) : "");
  const [grupoOrSuelta, setGrupoOrSuelta] = useState<string>(producto?.categoria ?? "");
  const [subcategoria, setSubcategoria] = useState<string>(producto?.subcategoria ?? "");
  const [estado, setEstado] = useState<Estado>(producto?.estado ?? "Disponible");
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);

  const [imagenUrl, setImagenUrl] = useState<string | null>(producto?.imagen_url ?? null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(producto?.imagen_url ?? null);
  const [comprimiendo, setComprimiendo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grupoSeleccionado = GRUPOS.find((g) => g.nombre === grupoOrSuelta);
  const esGrupo = Boolean(grupoSeleccionado);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setComprimiendo(true);
    try {
      const compressed = await compressToWebp(file);
      setImagenFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError("No pudimos procesar esa imagen. Probá con otra.");
    } finally {
      setComprimiendo(false);
    }
  }

  function quitarImagen() {
    setImagenFile(null);
    setImagenUrl(null);
    setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalImagenUrl = imagenUrl;

      if (imagenFile) {
        const path = `${Date.now()}-${imagenFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("productos-img")
          .upload(path, imagenFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("productos-img").getPublicUrl(path);
        finalImagenUrl = data.publicUrl;
      }

      // A suelta has no second level, so it mirrors its own name into
      // `subcategoria` — the single grouping key the admin list reads.
      const finalSubcategoria = esGrupo ? subcategoria : grupoOrSuelta;

      const payload = {
        nombre: nombre.trim(),
        descripcion_corta: descripcion.trim() || null,
        imagen_url: finalImagenUrl,
        categoria: grupoOrSuelta,
        subcategoria: finalSubcategoria,
        estado,
        precio: Number(precio),
        destacado,
      };

      if (producto) {
        const { error: updateError } = await supabase
          .from("productos")
          .update(payload)
          .eq("id", producto.id);
        if (updateError) throw updateError;
      } else {
        const { data: maxRows, error: maxError } = await supabase
          .from("productos")
          .select("orden_display")
          .eq("subcategoria", finalSubcategoria)
          .order("orden_display", { ascending: false })
          .limit(1);
        if (maxError) throw maxError;
        const nextOrden = (maxRows?.[0]?.orden_display ?? -1) + 1;

        const { error: insertError } = await supabase
          .from("productos")
          .insert({ ...payload, orden_display: nextOrden });
        if (insertError) throw insertError;
      }

      onSaved();
    } catch (err) {
      const detalle = err instanceof Error ? err.message : "";
      setError(
        detalle
          ? `No se pudo guardar: ${detalle}`
          : "No se pudo guardar el producto. Intentá de nuevo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy="form-titulo">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100dvh-2rem)] w-[min(100vw-1.5rem,36rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-linea px-5 py-4">
          <h2 id="form-titulo" className="font-display text-lg font-semibold text-marca-700">
            {producto ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-tinta-suave transition-colors hover:bg-marca-50 hover:text-tinta"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label className={label} htmlFor="f-nombre">
                Nombre <span className="text-alerta">*</span>
              </label>
              <input
                id="f-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Mate torpedo de algarrobo"
                className={field}
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label className={label} htmlFor="f-desc">
                  Descripción corta
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    descripcion.length >= DESCRIPCION_MAX ? "text-alerta" : "text-tinta-suave"
                  }`}
                >
                  {descripcion.length}/{DESCRIPCION_MAX}
                </span>
              </div>
              <textarea
                id="f-desc"
                value={descripcion}
                maxLength={DESCRIPCION_MAX}
                rows={2}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Curado, con virola de alpaca"
                className={`${field} resize-y`}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className={label} htmlFor="f-precio">
                  Precio (ARS) <span className="text-alerta">*</span>
                </label>
                <input
                  id="f-precio"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                  placeholder="15000"
                  className={field}
                />
              </div>

              <div className="grid gap-1.5">
                <label className={label} htmlFor="f-estado">
                  Estado
                </label>
                <select
                  id="f-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as Estado)}
                  className={field}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Sin stock">Sin stock</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className={label} htmlFor="f-cat">
                  Categoría <span className="text-alerta">*</span>
                </label>
                <select
                  id="f-cat"
                  value={grupoOrSuelta}
                  onChange={(e) => {
                    setGrupoOrSuelta(e.target.value);
                    setSubcategoria("");
                  }}
                  required
                  className={field}
                >
                  <option value="" disabled>
                    Elegir…
                  </option>
                  <optgroup label="Grupos">
                    {GRUPOS.map((g) => (
                      <option key={g.nombre} value={g.nombre}>
                        {g.nombre}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Sueltas">
                    {SUELTAS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {esGrupo && (
                <div className="grid gap-1.5">
                  <label className={label} htmlFor="f-sub">
                    Subcategoría <span className="text-alerta">*</span>
                  </label>
                  <select
                    id="f-sub"
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    required
                    className={field}
                  >
                    <option value="" disabled>
                      Elegir…
                    </option>
                    {grupoSeleccionado!.categorias.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <span className={label}>Imagen</span>
              <div className="flex items-center gap-4 rounded-xl border border-dashed border-linea-fuerte p-3">
                {preview ? (
                  // Blob previews and Supabase URLs both land here; next/image
                  // would need a loader for object URLs, so a plain img is right.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Vista previa del producto"
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-marca-50 text-marca-300">
                    <ImageIcon className="h-6 w-6" />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <label className="inline-flex min-h-[2.25rem] cursor-pointer items-center gap-2 rounded-lg bg-marca-50 px-3 text-sm font-medium text-marca-700 transition-colors hover:bg-marca-100">
                    <UploadIcon className="h-4 w-4" />
                    {comprimiendo ? "Comprimiendo…" : preview ? "Cambiar" : "Subir imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  {preview && (
                    <button
                      type="button"
                      onClick={quitarImagen}
                      className="ml-2 rounded-lg px-2 py-1 text-sm font-medium text-tinta-suave transition-colors hover:text-alerta"
                    >
                      Quitar
                    </button>
                  )}
                  <p className="mt-1.5 text-xs text-tinta-suave">
                    Se comprime a WebP antes de subir.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-lg py-1 text-sm font-medium text-tinta">
              <input
                type="checkbox"
                checked={destacado}
                onChange={(e) => setDestacado(e.target.checked)}
                className="h-[1.15rem] w-[1.15rem] rounded border-linea-fuerte accent-marca-400"
              />
              Mostrar en Destacados
            </label>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-alerta-suave px-3 py-2.5 text-sm text-alerta"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-linea bg-crema/40 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg px-4 text-sm font-medium text-tinta-suave transition-colors hover:bg-white hover:text-tinta"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || comprimiendo}
            className="inline-flex min-h-[2.5rem] items-center rounded-lg bg-marca-400 px-5 text-sm font-semibold text-white transition-colors hover:bg-marca-500 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
