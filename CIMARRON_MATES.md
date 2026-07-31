# Prompt: Landing + Catálogo + Panel Admin para emprendimiento de mates

> Pegá este documento completo como primer mensaje en una sesión nueva de Claude Code, dentro de una carpeta de proyecto vacía (o con `npx create-next-app` ya corrido). Completá primero las secciones marcadas `⬜ COMPLETAR` — si dejás algo en blanco, Claude te va a preguntar antes de avanzar en esa parte.

---

## 1. Qué se construye

Un sitio de una sola página (landing) con catálogo de productos filtrable, más un panel de administración privado para cargar/editar/borrar productos sin tocar código. Mismo patrón que un clon de e-commerce simple: **landing pública + admin CRUD**, ambos leyendo y escribiendo a la misma base de datos en tiempo real.

Rubro: **accesorios y artículos para mate** (mates, bombillas, yerberas, termos, etc. — ajustá la lista exacta en la sección 4).

## 2. Stack técnico (usar exactamente este, no sugerir alternativas)

- **Next.js** (App Router, últimas versión estable) + TypeScript
- **Tailwind CSS v4** (config vía `@theme` en `globals.css`, no `tailwind.config.js`)
- **Supabase** como backend: Postgres + Auth + Storage
  - `@supabase/supabase-js` para cliente público (landing, sin cookies)
  - `@supabase/ssr` para cliente server-side con sesión (admin)
  - Row Level Security: `select` público para todos, `insert/update/delete` solo `authenticated`
- **Framer Motion** para animaciones (reveals, marquee de destacados, transiciones de filtros)
- **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`) para reordenar productos por drag & drop en el admin
- Sin librería de UI (Radix, shadcn, etc.) — todo con Tailwind utility classes a mano

## 3. Estructura de datos

Tabla `productos` en Supabase:

```sql
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_corta text,
  imagen_url text,
  categoria text not null,
  subcategoria text not null,
  -- Atributo variable segun categoria (ver seccion 4). Array para permitir mas de un valor.
  atributo text[],
  estado text not null default 'Disponible' check (estado in ('Disponible', 'Sin stock')),
  precio integer not null check (precio >= 0),
  destacado boolean not null default false,
  orden_display integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.productos enable row level security;
create policy "lectura publica" on public.productos for select using (true);
create policy "escritura autenticada" on public.productos for all using (auth.role() = 'authenticated');
```

Bucket de Storage `productos-img` (público en lectura) para las fotos, subidas desde el admin ya comprimidas a `.webp` en el cliente antes de subir (no subir el archivo original pesado).

Tipo TypeScript equivalente en `lib/types.ts`:

```ts
export interface Producto {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: Categoria;
  subcategoria: string;
  atributo: string[] | null;
  estado: Estado;
  precio: number;
  destacado: boolean;
  orden_display: number;
  created_at: string;
}
```

## 4. Categorías y filtros ⬜ COMPLETAR

Este es el corazón del catálogo — completá esto ANTES de pasarle el prompt a Claude, o Claude te va a preguntar apenas llegue acá.

El sistema de filtros tiene dos niveles:

- **Grupos con desplegable**: tocás el grupo (ej. "Mates") y aparecen sus categorías reales debajo como chips (ej. "Torpedo", "Camionero"). El filtro "Todos" siempre está aparte.
- **Categorías sueltas**: no tienen desplegable, son un chip plano (ej. una categoría de temporada o de accesorios varios que no amerita agrupar).

Completá tu propia estructura acá (reemplazá el ejemplo):

```
⬜ GRUPOS (con categorías adentro):
  - Grupo: "Mates"
    - "Torpedo"
    - "Camionero"
    - "Imperial"
    - "Criollo"
    - "Ranchero"
    - "Algarrobo"
  - Grupo: "Bombillas"
    - "Alpaca"
    - "Acero"

⬜ CATEGORÍAS SUELTAS (sin desplegable):
  - "Termos/Vasos"
  - "Yerbas"
  - "Yerberas"
  - "Combos"
  - "Set Asado"
  - "Accesorios"
```

**Regla obligatoria**: cualquier filtro (grupo, categoría suelta, o categoría dentro de un grupo) que no tenga NINGÚN producto cargado no debe mostrarse — ni en la landing ni en el panel admin. Esto se recalcula en cada carga, comparando categorías existentes contra los productos reales.

## 5. Estructura de la landing (una sola página, secciones con anchor)

1. **Navbar** — sticky, logo a la izquierda, links a las secciones por ancla (`#catalogo`, `#contacto`, etc.), menú hamburguesa en mobile.
2. **Hero** (`#inicio`) — full height, logo grande centrado con parallax sutil al scrollear, tagline debajo, blobs decorativos con blur de fondo usando los colores de marca, indicador de scroll animado abajo.
3. **Destacados** (`#destacados`) — carrusel automático (marquee CSS, no JS de carrusel) de productos marcados como destacados en el admin. Si no hay ninguno destacado, la sección no se renderiza (no mostrar vacía).
4. **Catálogo** (`#catalogo`) — sección principal:
   - Barra de filtros: "Todos" + grupos + sueltas (según sección 4), con las subcategorías desplegándose al tocar un grupo
   - Rango de precio (slider doble, min/max dinámico según los productos cargados)
   - Toggle "Solo disponibles"
   - Grid de cards responsive (2 columnas mobile, 3-4 desktop), con animación de entrada/salida al filtrar
   - Estado vacío con mensaje claro si ningún producto matchea los filtros activos
5. **Footer** (`#contacto`) — logo, Instagram (icono + @usuario), WhatsApp (icono + texto "WhatsApp", linkea a `wa.me` con mensaje predefinido), ubicación (icono + ciudad), copyright con año dinámico. Fondo de un color de la paleta que contraste con la sección de arriba (blanco/crema), texto legible encima (ver sección 6, reglas de contraste).

### Card de producto

Imagen (aspect ratio ~4:5), badge de estado arriba a la derecha (verde "Disponible" / rojo "Sin stock", colores semánticos fijos — no cambian con la paleta de marca), nombre, descripción corta, atributo variable si aplica (ver sección 4), precio en grande, y **botón "Consultar" que abre WhatsApp** con mensaje pre-armado:

```
Hola, tengo una consulta por *Nombre del producto - $Precio*
```

(el `*texto*` es el formato de negrita nativo de WhatsApp — no HTML). El número de WhatsApp sale de una config central, no hardcodeado en cada componente.

## 6. Panel admin (`/admin`, protegido)

- **Login** (`/admin/login`): email + password contra Supabase Auth. Sin registro público — el usuario admin se crea manualmente en el dashboard de Supabase.
- **Middleware**: cualquier ruta bajo `/admin` (excepto `/admin/login`) redirige a login si no hay sesión.
- **Listado** (`/admin`): productos agrupados por el mismo esquema de grupos/categorías de la sección 4 (mismos filtros, misma regla de "ocultar si está vacío"). Cada fila muestra: imagen chica, nombre, precio, drag handle para reordenar (dentro de su categoría), estrella para marcar/desmarcar destacado, selector de estado (Disponible/Sin stock), botones Editar y Eliminar (con confirmación).
- **Form de producto** (modal, crear o editar):
  - Nombre* (requerido)
  - Descripción corta (con contador de caracteres, límite ~150)
  - Precio* (entero, ARS, requerido)
  - Categoría (grupo) → Subcategoría (dos selects encadenados, el segundo depende del primero)
  - Estado (select)
  - Destacado (checkbox)
  - Imagen (input file, preview inmediato, se comprime a webp en el cliente antes de subir a Storage)
  - Botones Cancelar / Guardar, con estado de carga y manejo de error visible

## 7. Paleta de colores

El proyecto original usa un sistema de **tokens de color en `app/globals.css`** vía `@theme` de Tailwind v4, con esta forma (8 escalones + 2 acentos):

```css
@theme {
  --color-marca-50:  #d4f0e5; /* el mas claro, fondo de secciones/tarjetas */
  --color-marca-100: #b8e6d1; /* Verde Menta */
  --color-marca-200: #8dcfae;
  --color-marca-300: #5a9e6f; /* Verde Claro */
  --color-marca-400: #2d6e3e; /* color principal: botones, chips activos - Verde Hierba Mate */
  --color-marca-500: #245535;
  --color-marca-600: #1e4a2f;
  --color-marca-700: #1a3d2a; /* el mas oscuro: titulos, texto de marca - Verde Profundo */
  --color-marca-blush: #d4a574; /* Dorado Elegante */
  --color-marca-cream: #f4e8d8; /* Beige Cálido */
}
```

### Paleta de Colores Cimarrón Mates

**Inspiración**: Extraída directamente del logo oficial, transmitiendo naturalidad, confianza y tradición.

| Tono | HEX | RGB | Uso |
|------|-----|-----|-----|
| **Marca 50** | #d4f0e5 | 212, 240, 229 | Fondos muy claros, alternancia de secciones |
| **Marca 100** | #b8e6d1 | 184, 230, 209 | Verde Menta - Fondos destacados |
| **Marca 200** | #8dcfae | 141, 207, 174 | Transición media-clara |
| **Marca 300** | #5a9e6f | 90, 158, 111 | Verde Claro - Hover effects |
| **Marca 400** | #2d6e3e | 45, 110, 62 | **Verde Hierba Mate - Principal** (botones, acentos) |
| **Marca 500** | #245535 | 36, 85, 53 | Transición media-oscura |
| **Marca 600** | #1e4a2f | 30, 74, 47 | Transición oscura |
| **Marca 700** | #1a3d2a | 26, 61, 42 | **Verde Profundo - Títulos, navbar** |
| **Blush** | #d4a574 | 212, 165, 116 | Dorado Elegante - Detalles premium |
| **Cream** | #f4e8d8 | 244, 232, 216 | Beige Cálido - Fondos cálidos |

**Tonos neutros complementarios** (para textos y bordes):
- Gris Oscuro: #2c3e50 (texto principal)
- Gris Medio: #7f8c8d (texto secundario)
- Gris Claro: #ecf0f1 (bordes, divisores)
- Blanco: #ffffff (fondos limpios)

**Combinaciones recomendadas**:
- **Hero/Headers**: Verde Profundo (#1a3d2a) fondo + Blanco texto + Dorado acentos
- **Botones CTA**: Verde Hierba Mate (#2d6e3e) + Blanco texto (contraste WCAG AA ✓)
- **Secciones alternas**: Beige Cálido (#f4e8d8) fondo + Verde Profundo títulos
- **Cards/Tarjetas**: Blanco fondo + Verde Profundo títulos + Verde Claro accents
- **Destacados**: Verde Menta (#b8e6d1) fondo + Verde Profundo texto

## 8. Logo ⬜ COMPLETAR

```
⬜ Tenés un archivo de logo ya diseñado (sí/no): SI
⬜ Si no, ¿usar texto estilizado con el nombre de la marca como placeholder? (sí/no) NO
⬜ Formato preferido si vas a subir uno después: PNG con fondo transparente, alto ancho (ideal ratio ~3.5:1 para verse bien en navbar/footer, o cuadrado si es un isotipo)
```

El logo se usa en 4 lugares: Navbar (chico), Hero (grande), Footer (mediano), y como favicon/ícono de pestaña — todos apuntando al mismo archivo así un reemplazo futuro se refleja en todos lados a la vez.

## 9. Datos de contacto ⬜ COMPLETAR (placeholder, no inventar)

```
⬜ Nombre de la marca: Cimarrón Mates
⬜ Tagline/frase corta para el Hero: Todo para el mate en un solo lugar
⬜ WhatsApp (código de país + número, sin + ni espacios): +5493476617678
⬜ Instagram (usuario): @cimarronmatesok
⬜ Ciudad / zona: Totoras, Santa Fe - Argentina
```

Todo esto va centralizado en un único archivo de config (`lib/config.ts`), nunca hardcodeado repetido en cada componente.

## 10. Cosas específicas que tienen que quedar bien (lecciones del proyecto original)

- **Catálogo sin cache stale**: la página del catálogo tiene que reflejar altas/bajas/ediciones del admin al instante, sin esperar minutos. En Next.js App Router esto es `export const revalidate = 0;` en la página que hace el fetch server-side de productos.
- **Filtro "Todos" independiente**: el chip "Todos" resetea categoría Y grupo a la vez, siempre visible aparte de los demás.
- **Al elegir un grupo sin elegir subcategoría todavía**: mostrar solo los productos de ESE grupo (no todos los productos), aunque no haya subcategoría puntual seleccionada.
- **Orden de estado en `onClick` combinados**: si un handler necesita resetear más de un estado a la vez (ej. cambiar de grupo Y limpiar la categoría elegida), cuidado con el orden de los `set` — el batching de React puede hacer que uno pise al otro si la función interna también toca ese mismo estado.
- Imágenes optimizadas con `next/image`, `sizes` correcto por breakpoint, sin upscaling (si subís una imagen chica, no forzarla a un tamaño más grande — se ve pixelada).
- El botón de WhatsApp NO va como botón flotante fijo en toda la pantalla — va en el footer y en cada card de producto individualmente.

## 11. Deploy

- Repo en GitHub (privado o público — si tu cuenta de Vercel es plan Hobby y el repo pertenece a una organización de GitHub en vez de tu cuenta personal, el deploy se bloquea salvo que el repo sea público o subas a Pro).
- Vercel conectado al repo, con env vars `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la "publishable key" nueva de Supabase, no la legacy).
- Después del primer deploy, agregar la URL de Vercel en Supabase → Authentication → URL Configuration (Site URL + Redirect URLs), sino el login del admin no funciona en producción.

---

**Antes de arrancar a programar**: si dejaste alguna sección ⬜ sin completar, preguntame los datos puntuales que falten antes de tocar código — no completes vos mismo con inventados.