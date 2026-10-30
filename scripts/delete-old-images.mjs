// Borra del bucket los archivos originales (PNG pesados) que reemplazó optimize-images.mjs.
//
// Toma las URLs viejas de scripts/backup-imagen-urls.json y NUNCA borra un archivo que
// algún producto use hoy. El borrado es permanente.
//
// Requiere un permiso temporal de DELETE sobre storage.objects (ver instrucciones del paso a paso).
//
// Uso (desde la raíz del proyecto):
//   node --env-file=.env.local scripts/delete-old-images.mjs            # simulacro, no borra nada
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//     node --env-file=.env.local scripts/delete-old-images.mjs --apply  # borra

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "productos-img";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const LOTE = 50;

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

function keyDe(imagenUrl) {
  const { pathname } = new URL(imagenUrl);
  if (!pathname.startsWith(PUBLIC_PREFIX)) return null;
  return decodeURIComponent(pathname.slice(PUBLIC_PREFIX.length));
}

const respaldo = JSON.parse(
  readFileSync(fileURLToPath(new URL("./backup-imagen-urls.json", import.meta.url)), "utf8")
);

const { data: productos, error: listError } = await supabase.from("productos").select("imagen_url");
if (listError) {
  console.error(`No se pudo leer productos: ${listError.message}`);
  process.exit(1);
}
const enUso = new Set(productos.map((p) => p.imagen_url && keyDe(p.imagen_url)).filter(Boolean));

const candidatos = [...new Set(respaldo.map((p) => p.imagen_url && keyDe(p.imagen_url)).filter(Boolean))];
const aBorrar = candidatos.filter((key) => !enUso.has(key));
const protegidos = candidatos.filter((key) => enUso.has(key));

console.log(`${apply ? "APLICANDO" : "SIMULACRO"}: ${candidatos.length} archivos originales en el respaldo.`);
console.log(`En uso por algún producto (no se tocan): ${protegidos.length}`);
protegidos.forEach((key) => console.log(`  protegido: ${key}`));
console.log(`A borrar: ${aBorrar.length}\n`);

if (!apply) {
  aBorrar.slice(0, 5).forEach((key) => console.log(`  ${key}`));
  if (aBorrar.length > 5) console.log(`  ... y ${aBorrar.length - 5} más`);
  console.log("\nSimulacro: no se borró nada. Agregá --apply para borrar.");
}

let borrados = 0;
for (let i = 0; apply && i < aBorrar.length; i += LOTE) {
  const lote = aBorrar.slice(i, i + LOTE);
  const { data, error } = await supabase.storage.from(BUCKET).remove(lote);
  if (error) {
    console.error(`Lote ${i / LOTE + 1}: ERROR ${error.message}`);
    continue;
  }
  // Sin permiso de DELETE, Supabase devuelve una lista vacía en lugar de un error.
  if (data.length !== lote.length) {
    console.error(
      `Lote ${i / LOTE + 1}: se pidió borrar ${lote.length} y se borraron ${data.length}. ` +
        "¿Falta el permiso temporal de DELETE?"
    );
  }
  borrados += data.length;
  console.log(`Lote ${i / LOTE + 1}: ${data.length}/${lote.length} borrados`);
}

if (apply) {
  console.log(`\nBorrados: ${borrados}/${aBorrar.length}`);
  // exitCode en vez de process.exit(): en Windows exit() con conexiones abiertas tira un assert de libuv.
  process.exitCode = borrados === aBorrar.length ? 0 : 1;
}
