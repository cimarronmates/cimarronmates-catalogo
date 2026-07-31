"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { compressToWebp } from "@/lib/image-compress";
import { GRUPOS, SUELTAS } from "@/lib/categories";
import type { Producto, Estado } from "@/lib/types";

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onSaved: () => void;
}

const DESCRIPCION_MAX = 150;

export default function ProductFormModal({ producto, onClose, onSaved }: Props) {
  const supabase = createBrowserClient();
  const isSuelta = producto ? SUELTAS.includes(producto.categoria) : false;

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion_corta ?? "");
  const [precio, setPrecio] = useState(producto?.precio ?? 0);
  const [grupoOrSuelta, setGrupoOrSuelta] = useState<string>(producto?.categoria ?? "");
  const [subcategoria, setSubcategoria] = useState<string>(producto?.subcategoria ?? "");
  const [estado, setEstado] = useState<Estado>(producto?.estado ?? "Disponible");
  const [destacado, setDestacado] = useState(producto?.destacado ?? false);
  const [imagenUrl, setImagenUrl] = useState<string | null>(producto?.imagen_url ?? null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(producto?.imagen_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grupoSeleccionado = GRUPOS.find((g) => g.nombre === grupoOrSuelta);
  const esGrupo = Boolean(grupoSeleccionado);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressToWebp(file);
    setImagenFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalImagenUrl = imagenUrl;

      if (imagenFile) {
        const path = `${Date.now()}-${imagenFile.name}`;
        const { error: uploadError } = await supabase.storage.from("productos-img").upload(path, imagenFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("productos-img").getPublicUrl(path);
        finalImagenUrl = data.publicUrl;
      }

      const finalSubcategoria = esGrupo ? subcategoria : grupoOrSuelta;

      const payload = {
        nombre,
        descripcion_corta: descripcion || null,
        imagen_url: finalImagenUrl,
        categoria: grupoOrSuelta,
        subcategoria: finalSubcategoria,
        estado,
        precio,
        destacado,
      };

      if (producto) {
        const { error: updateError } = await supabase.from("productos").update(payload).eq("id", producto.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("productos").insert(payload);
        if (insertError) throw insertError;
      }

      onSaved();
    } catch {
      setError("No se pudo guardar el producto. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-xl bg-white p-6">
        <h2 className="font-heading text-xl text-marca-700">{producto ? "Editar producto" : "Nuevo producto"}</h2>

        <label className="text-sm">Nombre*</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className="rounded border border-neutral-light px-3 py-2" />

        <label className="text-sm">Descripción corta ({descripcion.length}/{DESCRIPCION_MAX})</label>
        <textarea
          value={descripcion}
          maxLength={DESCRIPCION_MAX}
          onChange={(e) => setDescripcion(e.target.value)}
          className="rounded border border-neutral-light px-3 py-2"
        />

        <label className="text-sm">Precio (ARS)*</label>
        <input
          type="number"
          min={0}
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
          required
          className="rounded border border-neutral-light px-3 py-2"
        />

        <label className="text-sm">Categoría</label>
        <select
          value={grupoOrSuelta}
          onChange={(e) => {
            setGrupoOrSuelta(e.target.value);
            setSubcategoria("");
          }}
          required
          className="rounded border border-neutral-light px-3 py-2"
        >
          <option value="" disabled>Elegir...</option>
          <optgroup label="Grupos">
            {GRUPOS.map((g) => (
              <option key={g.nombre} value={g.nombre}>{g.nombre}</option>
            ))}
          </optgroup>
          <optgroup label="Sueltas">
            {SUELTAS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </optgroup>
        </select>

        {esGrupo && (
          <>
            <label className="text-sm">Subcategoría</label>
            <select
              value={subcategoria}
              onChange={(e) => setSubcategoria(e.target.value)}
              required
              className="rounded border border-neutral-light px-3 py-2"
            >
              <option value="" disabled>Elegir...</option>
              {grupoSeleccionado!.categorias.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </>
        )}

        <label className="text-sm">Estado</label>
        <select value={estado} onChange={(e) => setEstado(e.target.value as Estado)} className="rounded border border-neutral-light px-3 py-2">
          <option value="Disponible">Disponible</option>
          <option value="Sin stock">Sin stock</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
          Destacado
        </label>

        <label className="text-sm">Imagen</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="preview" className="h-32 w-32 rounded object-cover" />}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-neutral-mid">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-marca-400 px-4 py-2 text-white disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
