// Convierte las imágenes de productos (PNG pesados) a WebP liviano.
//
// Sube cada imagen convertida con una key nueva (<nombre>.webp) y actualiza
// `productos.imagen_url`. NO borra los archivos originales.
//
// Uso (desde la raíz del proyecto):
//   node --env-file=.env.local scripts/optimize-images.mjs            # simulacro, no escribe nada
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//     node --env-file=.env.local scripts/optimize-images.mjs --apply  # sube y actualiza

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "productos-img";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const MAX_SIDE = 900;
const QUALITY = 80;
const YA_LIVIANA = 120 * 1024;

const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Corré con --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

if (apply) {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    console.error("--apply necesita ADMIN_EMAIL y ADMIN_PASSWORD en el entorno.");
    process.exit(1);
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`No se pudo iniciar sesión: ${error.message}`);
    process.exit(1);
  }
}

const { data: productos, error: listError } = await supabase
  .from("productos")
  .select("id, nombre, imagen_url")
  .not("imagen_url", "is", null);
if (listError) {
  console.error(`No se pudo leer productos: ${listError.message}`);
  process.exit(1);
}

const pendientes = productos;
console.log(`${apply ? "APLICANDO" : "SIMULACRO"}: ${productos.length} productos con imagen.\n`);

if (apply) {
  // Respaldo de las URLs actuales por si hay que volver atrás (los archivos originales no se borran).
  const respaldo = fileURLToPath(new URL("./backup-imagen-urls.json", import.meta.url));
  writeFileSync(respaldo, JSON.stringify(productos, null, 2));
  console.log(`Respaldo de URLs originales: ${respaldo}\n`);
}

const convertidas = new Map(); // url original -> url nueva (productos que comparten imagen)
let bytesAntes = 0;
let bytesDespues = 0;
let fallos = 0;

for (const [i, p] of pendientes.entries()) {
  const etiqueta = `[${i + 1}/${pendientes.length}] ${p.nombre}`;
  try {
    if (convertidas.has(p.imagen_url)) {
      if (apply) await actualizarProducto(p.id, convertidas.get(p.imagen_url));
      console.log(`${etiqueta}: misma imagen que otro producto, reutilizada`);
      continue;
    }

    const origen = new URL(p.imagen_url);
    if (!origen.pathname.startsWith(PUBLIC_PREFIX)) {
      throw new Error("la URL no es del bucket productos-img");
    }

    const respuesta = await fetch(p.imagen_url);
    if (!respuesta.ok) throw new Error(`descarga falló (${respuesta.status})`);
    const original = Buffer.from(await respuesta.arrayBuffer());

    // La extensión no es confiable (hay PNG guardados como .webp): se mira el formato real.
    const { format } = await sharp(original).metadata();
    if (format === "webp" && original.length <= YA_LIVIANA) {
      console.log(`${etiqueta}: ya es WebP liviano, se deja`);
      continue;
    }

    const webp = await sharp(original)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();

    bytesAntes += original.length;
    bytesDespues += webp.length;

    const keyOriginal = decodeURIComponent(origen.pathname.slice(PUBLIC_PREFIX.length));
    const base = keyOriginal.replace(/\.[^./]+$/, "");
    // Si el original ya se llama .webp, la key nueva no puede ser la misma (no hay permiso para pisar).
    const keyNueva = keyOriginal.endsWith(".webp") ? `${base}-opt.webp` : `${base}.webp`;
    const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

    if (apply) {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(keyNueva, webp, { contentType: "image/webp", cacheControl: "31536000" });
      // Si ya existe es de una corrida anterior: se reutiliza.
      if (uploadError && !/already exists/i.test(uploadError.message)) throw uploadError;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(keyNueva);
      await actualizarProducto(p.id, data.publicUrl);
      convertidas.set(p.imagen_url, data.publicUrl);
    }

    console.log(`${etiqueta}: ${kb(original.length)} -> ${kb(webp.length)}`);
  } catch (err) {
    fallos++;
    console.error(`${etiqueta}: ERROR ${err instanceof Error ? err.message : err}`);
  }
}

async function actualizarProducto(id, imagenUrl) {
  const { data, error } = await supabase
    .from("productos")
    .update({ imagen_url: imagenUrl })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("el UPDATE no afectó ninguna fila (¿sesión sin permisos?)");
}

const mb = (n) => (n / 1048576).toFixed(1);
console.log(
  `\nTotal: ${mb(bytesAntes)} MB -> ${mb(bytesDespues)} MB` +
    (bytesAntes ? ` (-${Math.round((1 - bytesDespues / bytesAntes) * 100)}%)` : "")
);
console.log(`Fallos: ${fallos}`);
if (!apply) console.log("Simulacro: no se subió ni modificó nada. Agregá --apply para aplicar.");
process.exit(fallos ? 1 : 0);
