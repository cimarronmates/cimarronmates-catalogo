# Cimarrón Mates — Landing + Catálogo + Panel Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page public landing with a filterable product catalog for "Cimarrón Mates" (mate accessories store), plus a password-protected `/admin` CRUD panel, both reading/writing the same Supabase Postgres table in real time.

**Architecture:** Next.js 16 App Router + TypeScript, Tailwind CSS v4 (`@theme` tokens, no config file), Supabase (Postgres + Auth + Storage) as the only backend, Framer Motion for animation, `@dnd-kit` for admin drag-reorder. No UI kit (Radix/shadcn) — hand-rolled Tailwind components. Public landing uses the anon Supabase client server-side with `revalidate = 0`; admin uses `@supabase/ssr` session-aware client behind middleware.

**Tech Stack:** Next.js 16 (App Router, TS), Tailwind CSS v4, `@supabase/supabase-js`, `@supabase/ssr`, `framer-motion`, `@dnd-kit/core` + `@dnd-kit/sortable`, `browser-image-compression` (client-side webp compression), Vitest + React Testing Library (logic/unit tests only — visual components get a manual browser-verification step instead of a forced unit test).

## Global Constraints

- Stack is fixed by the spec (`CIMARRON_MATES.md`) — do not substitute libraries (e.g. no shadcn/Radix, no JS carousel library, no `tailwind.config.js`).
- Tailwind v4 tokens go in `src/app/globals.css` via `@theme`, using the exact hex values in section 7 of the spec.
- Brand config (name, tagline, WhatsApp number, Instagram, city) lives only in `src/lib/config.ts` — never hardcoded elsewhere. Values (confirmed, do not invent): brand "Cimarrón Mates", tagline "Todo para el mate en un solo lugar", WhatsApp `5493476617678`, Instagram `@cimarronmatesok`, city "Totoras, Santa Fe - Argentina".
- Categories (confirmed via user, using the spec's example as final data):
  - Grupos: "Mates" → [Torpedo, Camionero, Imperial, Criollo, Ranchero, Algarrobo]; "Bombillas" → [Alpaca, Acero]
  - Sueltas: Termos/Vasos, Yerbas, Yerberas, Combos, Set Asado, Accesorios
  - Any filter (group, loose category, or subcategory) with zero matching products must not render, recomputed from live data every load.
- Catalog page must never show stale data: `export const revalidate = 0` on the server component that fetches products.
- WhatsApp "Consultar" button per product, message format exactly: `Hola, tengo una consulta por *Nombre del producto - $Precio*` (literal `*...*`, WhatsApp bold, not HTML). Number comes from `lib/config.ts`, never hardcoded per-component.
- No floating fixed WhatsApp button — only in Footer and per product card.
- Images via `next/image`, correct `sizes`, no upscaling small source images.
- Admin state-reset handlers (e.g. switching group clears subcategory) must set both pieces of state in the same handler call, not via a nested effect that could race with React's batching (see spec §10).
- Supabase RLS: public `select` for everyone, `insert/update/delete` restricted to `authenticated` only.
- Supabase project/table/bucket/auth user creation is **manual** — the user does this after the code lands. Do not attempt to provision Supabase infrastructure via MCP tools in this plan.
- This folder gets its own git repo (nested inside the parent Desktop repo, not a submodule) — Task 1 initializes it.

---

## File Structure

```
Cimarron Mates/
├── docs/superpowers/plans/2026-07-31-cimarron-mates.md   (this file)
├── CIMARRON_MATES.md                  (spec, unchanged)
├── logo.png → public/logo.png         (moved in Task 1)
├── supabase/
│   └── migrations/001_productos.sql   (table + RLS + bucket policy, run manually by user)
├── .env.example
├── src/
│   ├── app/
│   │   ├── globals.css                (Tailwind v4 @theme tokens)
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (landing: Navbar, Hero, Destacados, Catalogo, Footer)
│   │   └── admin/
│   │       ├── login/page.tsx
│   │       ├── page.tsx                (product list, grouped, drag reorder)
│   │       └── layout.tsx              (auth-gated shell)
│   ├── middleware.ts                   (redirect /admin/* → /admin/login if no session)
│   ├── lib/
│   │   ├── config.ts                   (brand/contact config)
│   │   ├── categories.ts               (GRUPOS/SUELTAS static structure)
│   │   ├── types.ts                    (Producto, Categoria, Estado types)
│   │   ├── whatsapp.ts                 (buildConsultaLink, buildFooterLink)
│   │   ├── filters.ts                  (pure filter/visibility logic — unit tested)
│   │   ├── image-compress.ts           (webp compression before upload)
│   │   └── supabase/
│   │       ├── client.ts               (public anon browser client)
│   │       └── server.ts               (SSR session client for admin, via @supabase/ssr)
│   └── components/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── Destacados.tsx
│       ├── Catalogo.tsx                (client component: filters + grid, uses lib/filters.ts)
│       ├── ProductCard.tsx
│       ├── PriceRangeSlider.tsx
│       ├── Footer.tsx
│       └── admin/
│           ├── ProductList.tsx         (dnd-kit sortable rows, grouped)
│           ├── ProductFormModal.tsx    (create/edit form)
│           └── LoginForm.tsx
└── tests/
    ├── filters.test.ts
    ├── whatsapp.test.ts
    └── categories.test.ts
```

---

### Task 1: Project scaffold, git init, dependencies

**Files:**
- Create: whole Next.js project (via `create-next-app`) rooted at `Cimarron Mates/`
- Move: `logo.png` → `public/logo.png`
- Create: `.gitignore` (from Next.js template), `.env.example`

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js 16 + TS + Tailwind v4 App Router project at the repo root, with `framer-motion`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@supabase/supabase-js`, `@supabase/ssr`, `browser-image-compression`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` installed.

- [ ] **Step 1: Init git repo in this folder**

```bash
git init
```

Expected: `Initialized empty Git repository in .../Cimarron Mates/.git/`

- [ ] **Step 2: Scaffold Next.js app in place**

Run from inside `Cimarron Mates/` (answer prompts: TypeScript yes, ESLint yes, Tailwind yes, `src/` dir yes, App Router yes, import alias `@/*` yes):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: project files created (`package.json`, `src/app/`, `next.config.ts`, etc.) without overwriting `CIMARRON_MATES.md` or `logo.png` (create-next-app will prompt if the dir isn't empty — confirm keeping existing files).

- [ ] **Step 3: Verify Tailwind v4**

```bash
cat package.json | grep tailwindcss
```

Expected: `"tailwindcss": "^4"` (if v3 was scaffolded instead, run `npm install tailwindcss@latest @tailwindcss/postcss@latest` and update `postcss.config.mjs` per Tailwind v4 docs).

- [ ] **Step 4: Move logo into public/**

```bash
mkdir -p public
mv logo.png public/logo.png
```

- [ ] **Step 5: Install remaining dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities browser-image-compression
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 6: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 7: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 8: Verify dev server boots**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` with the default Next.js page (no errors in terminal). Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 + Tailwind v4 project, install deps"
```

---

### Task 2: Brand tokens, fonts, global styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS custom properties `--color-marca-{50,100,200,300,400,500,600,700}`, `--color-marca-blush`, `--color-marca-cream` usable as Tailwind utilities (`bg-marca-400`, `text-marca-700`, etc.) via `@theme`.

- [ ] **Step 1: Write brand tokens in globals.css**

Replace the `@theme` block (or add one) in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-marca-50:  #d4f0e5;
  --color-marca-100: #b8e6d1;
  --color-marca-200: #8dcfae;
  --color-marca-300: #5a9e6f;
  --color-marca-400: #2d6e3e;
  --color-marca-500: #245535;
  --color-marca-600: #1e4a2f;
  --color-marca-700: #1a3d2a;
  --color-marca-blush: #d4a574;
  --color-marca-cream: #f4e8d8;

  --color-neutral-dark: #2c3e50;
  --color-neutral-mid: #7f8c8d;
  --color-neutral-light: #ecf0f1;

  --font-heading: "Georgia", serif;
  --font-sans: system-ui, -apple-system, sans-serif;
}

body {
  font-family: var(--font-sans);
  color: var(--color-neutral-dark);
  background: #ffffff;
}
```

- [ ] **Step 2: Verify utilities compile**

Add `className="bg-marca-400 text-white"` to the placeholder text in `src/app/page.tsx` temporarily, run `npm run dev`, confirm the green background renders in browser at `localhost:3000`. Remove the temporary className after confirming.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Cimarron Mates brand color tokens and fonts"
```

---

### Task 3: Central config and static category data

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/lib/categories.ts`
- Create: `src/lib/types.ts`
- Test: `tests/categories.test.ts`

**Interfaces:**
- Produces:
  - `siteConfig: { brandName: string; tagline: string; whatsappNumber: string; instagramHandle: string; city: string }`
  - `GRUPOS: { nombre: string; categorias: string[] }[]`
  - `SUELTAS: string[]`
  - `type Categoria = string` (grupo or suelta name — validated at runtime against product data, not a closed union, since it's admin-editable data)
  - `type Estado = "Disponible" | "Sin stock"`
  - `interface Producto { id: string; nombre: string; descripcion_corta: string | null; imagen_url: string | null; categoria: string; subcategoria: string; atributo: string[] | null; estado: Estado; precio: number; destacado: boolean; orden_display: number; created_at: string; }`

- [ ] **Step 1: Write failing test for categories structure**

```ts
// tests/categories.test.ts
import { describe, it, expect } from "vitest";
import { GRUPOS, SUELTAS } from "@/lib/categories";

describe("categories", () => {
  it("has the Mates and Bombillas groups with their subcategories", () => {
    expect(GRUPOS).toEqual([
      { nombre: "Mates", categorias: ["Torpedo", "Camionero", "Imperial", "Criollo", "Ranchero", "Algarrobo"] },
      { nombre: "Bombillas", categorias: ["Alpaca", "Acero"] },
    ]);
  });

  it("has the confirmed loose categories", () => {
    expect(SUELTAS).toEqual(["Termos/Vasos", "Yerbas", "Yerberas", "Combos", "Set Asado", "Accesorios"]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm run test -- categories
```

Expected: FAIL — `Cannot find module '@/lib/categories'`

- [ ] **Step 3: Implement config.ts**

```ts
// src/lib/config.ts
export const siteConfig = {
  brandName: "Cimarrón Mates",
  tagline: "Todo para el mate en un solo lugar",
  whatsappNumber: "5493476617678",
  instagramHandle: "@cimarronmatesok",
  city: "Totoras, Santa Fe - Argentina",
} as const;
```

- [ ] **Step 4: Implement categories.ts**

```ts
// src/lib/categories.ts
export interface Grupo {
  nombre: string;
  categorias: string[];
}

export const GRUPOS: Grupo[] = [
  { nombre: "Mates", categorias: ["Torpedo", "Camionero", "Imperial", "Criollo", "Ranchero", "Algarrobo"] },
  { nombre: "Bombillas", categorias: ["Alpaca", "Acero"] },
];

export const SUELTAS: string[] = ["Termos/Vasos", "Yerbas", "Yerberas", "Combos", "Set Asado", "Accesorios"];
```

- [ ] **Step 5: Implement types.ts**

```ts
// src/lib/types.ts
export type Estado = "Disponible" | "Sin stock";

export interface Producto {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: string;
  subcategoria: string;
  atributo: string[] | null;
  estado: Estado;
  precio: number;
  destacado: boolean;
  orden_display: number;
  created_at: string;
}
```

- [ ] **Step 6: Run test, verify it passes**

```bash
npm run test -- categories
```

Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add src/lib/config.ts src/lib/categories.ts src/lib/types.ts tests/categories.test.ts
git commit -m "feat: add site config, category data, and Producto types"
```

---

### Task 4: WhatsApp link builder

**Files:**
- Create: `src/lib/whatsapp.ts`
- Test: `tests/whatsapp.test.ts`

**Interfaces:**
- Consumes: `siteConfig.whatsappNumber` from Task 3.
- Produces: `buildConsultaLink(producto: { nombre: string; precio: number }): string`, `buildContactoLink(mensaje?: string): string`.

- [ ] **Step 1: Write failing test**

```ts
// tests/whatsapp.test.ts
import { describe, it, expect } from "vitest";
import { buildConsultaLink, buildContactoLink } from "@/lib/whatsapp";

describe("whatsapp links", () => {
  it("builds a product consulta link with bold whatsapp formatting", () => {
    const link = buildConsultaLink({ nombre: "Mate Torpedo", precio: 15000 });
    expect(link).toBe(
      "https://wa.me/5493476617678?text=" +
        encodeURIComponent("Hola, tengo una consulta por *Mate Torpedo - $15000*")
    );
  });

  it("builds a generic contact link", () => {
    const link = buildContactoLink();
    expect(link).toBe("https://wa.me/5493476617678");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm run test -- whatsapp
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/whatsapp.ts
import { siteConfig } from "@/lib/config";

export function buildConsultaLink(producto: { nombre: string; precio: number }): string {
  const mensaje = `Hola, tengo una consulta por *${producto.nombre} - $${producto.precio}*`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export function buildContactoLink(mensaje?: string): string {
  if (!mensaje) return `https://wa.me/${siteConfig.whatsappNumber}`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm run test -- whatsapp
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts tests/whatsapp.test.ts
git commit -m "feat: add whatsapp link builder"
```

---

### Task 5: Filter/visibility pure logic

This is the trickiest part of the spec (§10): "Todos" resets both group and category; picking a group with no subcategory shows all products in that group; empty filters must not render; price range must be dynamic from loaded data.

**Files:**
- Create: `src/lib/filters.ts`
- Test: `tests/filters.test.ts`

**Interfaces:**
- Consumes: `Producto` from Task 3, `GRUPOS`/`SUELTAS` from Task 3.
- Produces:
  - `type FilterState = { grupo: string | null; categoria: string | null; soloDisponibles: boolean; precioMin: number; precioMax: number }`
  - `getInitialFilterState(productos: Producto[]): FilterState`
  - `applyFilters(productos: Producto[], filters: FilterState): Producto[]`
  - `getVisibleGrupos(productos: Producto[]): Grupo[]` — grupos with at least one matching product, and each grupo's `categorias` pruned to only those with products
  - `getVisibleSueltas(productos: Producto[]): string[]`
  - `getPriceBounds(productos: Producto[]): { min: number; max: number }`

- [ ] **Step 1: Write failing tests**

```ts
// tests/filters.test.ts
import { describe, it, expect } from "vitest";
import {
  applyFilters,
  getInitialFilterState,
  getVisibleGrupos,
  getVisibleSueltas,
  getPriceBounds,
  type FilterState,
} from "@/lib/filters";
import type { Producto } from "@/lib/types";

function producto(overrides: Partial<Producto>): Producto {
  return {
    id: "1",
    nombre: "Mate Torpedo",
    descripcion_corta: null,
    imagen_url: null,
    categoria: "Mates",
    subcategoria: "Torpedo",
    atributo: null,
    estado: "Disponible",
    precio: 10000,
    destacado: false,
    orden_display: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("filters", () => {
  const productos = [
    producto({ id: "1", categoria: "Mates", subcategoria: "Torpedo", precio: 10000 }),
    producto({ id: "2", categoria: "Mates", subcategoria: "Camionero", precio: 20000, estado: "Sin stock" }),
    producto({ id: "3", categoria: "Bombillas", subcategoria: "Alpaca", precio: 5000 }),
    producto({ id: "4", categoria: "Yerbas", subcategoria: "Yerbas", precio: 3000 }),
  ];

  it("hides groups and subcategories with zero products", () => {
    const visibleGrupos = getVisibleGrupos(productos);
    expect(visibleGrupos).toEqual([
      { nombre: "Mates", categorias: ["Torpedo", "Camionero"] },
      { nombre: "Bombillas", categorias: ["Alpaca"] },
    ]);
  });

  it("hides loose categories with zero products", () => {
    expect(getVisibleSueltas(productos)).toEqual(["Yerbas"]);
  });

  it("computes dynamic price bounds", () => {
    expect(getPriceBounds(productos)).toEqual({ min: 3000, max: 20000 });
  });

  it("selecting a group with no subcategory shows all products in that group", () => {
    const filters: FilterState = { grupo: "Mates", categoria: null, soloDisponibles: false, precioMin: 0, precioMax: 999999 };
    const result = applyFilters(productos, filters);
    expect(result.map((p) => p.id).sort()).toEqual(["1", "2"]);
  });

  it("selecting a subcategory narrows further", () => {
    const filters: FilterState = { grupo: "Mates", categoria: "Torpedo", soloDisponibles: false, precioMin: 0, precioMax: 999999 };
    expect(applyFilters(productos, filters).map((p) => p.id)).toEqual(["1"]);
  });

  it("Todos (grupo=null, categoria=null) returns everything within price/estado bounds", () => {
    const filters: FilterState = { grupo: null, categoria: null, soloDisponibles: false, precioMin: 0, precioMax: 999999 };
    expect(applyFilters(productos, filters)).toHaveLength(4);
  });

  it("soloDisponibles filters out Sin stock", () => {
    const filters: FilterState = { grupo: null, categoria: null, soloDisponibles: true, precioMin: 0, precioMax: 999999 };
    const result = applyFilters(productos, filters);
    expect(result.find((p) => p.id === "2")).toBeUndefined();
  });

  it("price range filters by precio inclusive bounds", () => {
    const filters: FilterState = { grupo: null, categoria: null, soloDisponibles: false, precioMin: 4000, precioMax: 15000 };
    expect(applyFilters(productos, filters).map((p) => p.id).sort()).toEqual(["1"]);
  });

  it("getInitialFilterState seeds precioMin/Max from data and clears grupo/categoria", () => {
    const state = getInitialFilterState(productos);
    expect(state).toEqual({ grupo: null, categoria: null, soloDisponibles: false, precioMin: 3000, precioMax: 20000 });
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
npm run test -- filters
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/filters.ts
import { GRUPOS, SUELTAS, type Grupo } from "@/lib/categories";
import type { Producto } from "@/lib/types";

export interface FilterState {
  grupo: string | null;
  categoria: string | null;
  soloDisponibles: boolean;
  precioMin: number;
  precioMax: number;
}

export function getPriceBounds(productos: Producto[]): { min: number; max: number } {
  if (productos.length === 0) return { min: 0, max: 0 };
  const precios = productos.map((p) => p.precio);
  return { min: Math.min(...precios), max: Math.max(...precios) };
}

export function getInitialFilterState(productos: Producto[]): FilterState {
  const { min, max } = getPriceBounds(productos);
  return { grupo: null, categoria: null, soloDisponibles: false, precioMin: min, precioMax: max };
}

export function getVisibleGrupos(productos: Producto[]): Grupo[] {
  return GRUPOS.map((grupo) => ({
    nombre: grupo.nombre,
    categorias: grupo.categorias.filter((sub) =>
      productos.some((p) => p.categoria === grupo.nombre && p.subcategoria === sub)
    ),
  })).filter((grupo) => grupo.categorias.length > 0);
}

export function getVisibleSueltas(productos: Producto[]): string[] {
  return SUELTAS.filter((suelta) => productos.some((p) => p.categoria === suelta));
}

export function applyFilters(productos: Producto[], filters: FilterState): Producto[] {
  return productos.filter((p) => {
    if (filters.grupo && p.categoria !== filters.grupo) return false;
    if (filters.categoria && p.subcategoria !== filters.categoria) return false;
    if (filters.soloDisponibles && p.estado !== "Disponible") return false;
    if (p.precio < filters.precioMin || p.precio > filters.precioMax) return false;
    return true;
  });
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
npm run test -- filters
```

Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/filters.ts tests/filters.test.ts
git commit -m "feat: add pure catalog filter logic with dynamic visibility and price bounds"
```

---

### Task 6: Supabase clients and SQL migration

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `supabase/migrations/001_productos.sql`
- Create: `README.md` (Supabase setup instructions section)

**Interfaces:**
- Produces: `createBrowserClient()` (anon, for landing + client components), `createServerClient(cookieStore)` (session-aware, for admin SSR/middleware).

- [ ] **Step 1: Write the public browser client**

```ts
// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Write the SSR session client**

```ts
// src/lib/supabase/server.ts
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

- [ ] **Step 3: Write the SQL migration file**

```sql
-- supabase/migrations/001_productos.sql
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_corta text,
  imagen_url text,
  categoria text not null,
  subcategoria text not null,
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

-- Storage: crear bucket "productos-img" (público en lectura) desde el dashboard de Supabase,
-- o con: insert into storage.buckets (id, name, public) values ('productos-img', 'productos-img', true);
```

- [ ] **Step 4: Write README setup section**

```markdown
## Setup de Supabase (manual, una sola vez)

1. Crear proyecto en https://supabase.com/dashboard
2. SQL Editor → pegar y correr `supabase/migrations/001_productos.sql`
3. Storage → crear bucket `productos-img`, marcarlo público en lectura
4. Authentication → Users → crear manualmente el usuario admin (email + password), sin registro público
5. Project Settings → API → copiar `Project URL` y `anon public` key a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
6. Después del primer deploy en Vercel: Authentication → URL Configuration → agregar la URL de Vercel en Site URL y Redirect URLs.
```

- [ ] **Step 5: Verify build still compiles**

```bash
npm run build
```

Expected: build succeeds (env vars can be empty strings at build time for static parts; runtime errors only occur when Supabase calls actually execute).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase supabase/migrations/001_productos.sql README.md
git commit -m "feat: add supabase clients and productos table migration"
```

---

### Task 7: Navbar

**Files:**
- Create: `src/components/Navbar.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig` (Task 3) for brand name/logo alt text.
- Produces: `<Navbar />` — sticky, logo left (`/logo.png` via `next/image`), anchor links (`#inicio`, `#destacados`, `#catalogo`, `#contacto`), hamburger menu on mobile (client component, `useState` for open/close).

- [ ] **Step 1: Implement Navbar**

```tsx
// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/config";

const LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#destacados", label: "Destacados" },
  { href: "#catalogo", label: "Catálogo" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-marca-700/95 backdrop-blur text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#inicio" className="flex items-center gap-2">
          <Image src="/logo.png" alt={siteConfig.brandName} width={40} height={40} className="h-10 w-auto" />
        </a>

        <nav className="hidden gap-6 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-marca-blush">
              {link.label}
            </a>
          ))}
        </nav>

        <button
          className="md:hidden"
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-white" />
          <span className="mt-1.5 block h-0.5 w-6 bg-white" />
          <span className="mt-1.5 block h-0.5 w-6 bg-white" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 md:hidden">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-1">
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Mount in page.tsx**

```tsx
// src/app/page.tsx (partial — replace default content)
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <section id="inicio" className="h-screen" />
    </main>
  );
}
```

- [ ] **Step 3: Manual browser verification**

```bash
npm run dev
```

Open `http://localhost:3000`. Confirm: navbar sticky on scroll, logo visible, hamburger menu opens/closes on a mobile-width viewport (resize browser < 768px).

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx src/app/page.tsx
git commit -m "feat: add sticky navbar with mobile hamburger menu"
```

---

### Task 8: Hero section

**Files:**
- Create: `src/components/Hero.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `siteConfig.tagline`, `framer-motion` (`useScroll`, `useTransform`, `motion.div`).
- Produces: `<Hero />` full-height section, id `inicio`, logo with subtle parallax on scroll, tagline, blurred decorative blobs in brand colors, animated scroll indicator.

- [ ] **Step 1: Implement Hero**

```tsx
// src/components/Hero.tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { siteConfig } from "@/lib/config";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section id="inicio" ref={ref} className="relative flex h-screen items-center justify-center overflow-hidden bg-marca-700">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-marca-400/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-marca-blush/30 blur-3xl" />

      <motion.div style={{ y }} className="relative z-10 flex flex-col items-center gap-6 px-4 text-center text-white">
        <Image src="/logo.png" alt={siteConfig.brandName} width={220} height={220} className="h-auto w-40 md:w-56" priority />
        <p className="font-heading text-xl md:text-2xl">{siteConfig.tagline}</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80"
        aria-hidden
      >
        ↓
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Mount below Navbar in page.tsx**

```tsx
import Hero from "@/components/Hero";
// ...
<Navbar />
<Hero />
```

(remove the placeholder `<section id="inicio" className="h-screen" />` from Task 7)

- [ ] **Step 3: Manual browser verification**

Confirm in browser: hero fills viewport height, logo shifts slightly on scroll (parallax), blobs visible with blur, down-arrow bounces continuously.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.tsx src/app/page.tsx
git commit -m "feat: add hero section with parallax logo and scroll indicator"
```

---

### Task 9: Product card component

**Files:**
- Create: `src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: `Producto` (Task 3), `buildConsultaLink` (Task 4).
- Produces: `<ProductCard producto={Producto} />` — image (4:5 aspect via `next/image` + `aspect-[4/5]`), status badge (green/red, fixed semantic colors independent of brand palette), name, description, `atributo` chips if present, price, "Consultar" button linking to WhatsApp.

- [ ] **Step 1: Implement ProductCard**

```tsx
// src/components/ProductCard.tsx
import Image from "next/image";
import type { Producto } from "@/lib/types";
import { buildConsultaLink } from "@/lib/whatsapp";

export default function ProductCard({ producto }: { producto: Producto }) {
  const disponible = producto.estado === "Disponible";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative aspect-[4/5] w-full">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-marca-50 text-marca-700">Sin imagen</div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold text-white ${
            disponible ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {producto.estado}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-lg text-marca-700">{producto.nombre}</h3>
        {producto.descripcion_corta && <p className="text-sm text-neutral-mid">{producto.descripcion_corta}</p>}
        {producto.atributo && producto.atributo.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {producto.atributo.map((a) => (
              <span key={a} className="rounded-full bg-marca-50 px-2 py-0.5 text-xs text-marca-700">
                {a}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xl font-bold text-marca-700">${producto.precio.toLocaleString("es-AR")}</p>
        <a
          href={buildConsultaLink(producto)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-lg bg-marca-400 px-4 py-2 text-center text-white transition hover:bg-marca-500"
        >
          Consultar
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Manual verification via temporary harness**

Temporarily render one `<ProductCard producto={...mock} />` in `page.tsx` with a hardcoded mock product (no image url, to test the "Sin imagen" fallback, then with an external image URL to test the image path). Confirm badge color, price formatting (`$15.000`), Consultar button opens `wa.me` link with correct prefilled text. Remove temporary mock after confirming.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductCard.tsx
git commit -m "feat: add product card with whatsapp consulta button"
```

---

### Task 10: Price range slider

**Files:**
- Create: `src/components/PriceRangeSlider.tsx`

**Interfaces:**
- Produces: `<PriceRangeSlider min={number} max={number} value={[number, number]} onChange={(range: [number, number]) => void} />` — dual-thumb range using two native `<input type="range">` overlaid (no extra dependency).

- [ ] **Step 1: Implement**

```tsx
// src/components/PriceRangeSlider.tsx
"use client";

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export default function PriceRangeSlider({ min, max, value, onChange }: Props) {
  const [low, high] = value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm text-neutral-mid">
        <span>${low.toLocaleString("es-AR")}</span>
        <span>${high.toLocaleString("es-AR")}</span>
      </div>
      <div className="relative h-6">
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
          className="absolute w-full accent-marca-400"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
          className="absolute w-full accent-marca-400"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Temporarily mount with `min={0} max={100000}` in a scratch page, drag both thumbs, confirm low never exceeds high and vice versa. Remove scratch mount.

- [ ] **Step 3: Commit**

```bash
git add src/components/PriceRangeSlider.tsx
git commit -m "feat: add dual-thumb price range slider"
```

---

### Task 11: Catálogo section (filters + grid)

**Files:**
- Create: `src/components/Catalogo.tsx`

**Interfaces:**
- Consumes: `Producto[]` (passed as prop from server-fetched data in Task 15), `getVisibleGrupos`, `getVisibleSueltas`, `getPriceBounds`, `getInitialFilterState`, `applyFilters`, `FilterState` (Task 5), `ProductCard` (Task 9), `PriceRangeSlider` (Task 10), `framer-motion` `AnimatePresence`/`motion.div`.
- Produces: `<Catalogo productos={Producto[]} />` client component, id `catalogo`.

- [ ] **Step 1: Implement Catalogo**

```tsx
// src/components/Catalogo.tsx
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Producto } from "@/lib/types";
import {
  applyFilters,
  getInitialFilterState,
  getPriceBounds,
  getVisibleGrupos,
  getVisibleSueltas,
  type FilterState,
} from "@/lib/filters";
import ProductCard from "@/components/ProductCard";
import PriceRangeSlider from "@/components/PriceRangeSlider";

export default function Catalogo({ productos }: { productos: Producto[] }) {
  const [filters, setFilters] = useState<FilterState>(() => getInitialFilterState(productos));

  const grupos = useMemo(() => getVisibleGrupos(productos), [productos]);
  const sueltas = useMemo(() => getVisibleSueltas(productos), [productos]);
  const bounds = useMemo(() => getPriceBounds(productos), [productos]);
  const visibles = useMemo(() => applyFilters(productos, filters), [productos, filters]);

  function selectTodos() {
    setFilters((f) => ({ ...f, grupo: null, categoria: null }));
  }

  function selectGrupo(nombre: string) {
    // Reset categoria in the same call that sets grupo — avoids the batching
    // race described in spec §10 where a nested update could clobber this one.
    setFilters((f) => ({ ...f, grupo: f.grupo === nombre ? null : nombre, categoria: null }));
  }

  function selectCategoria(nombre: string) {
    setFilters((f) => ({ ...f, categoria: f.categoria === nombre ? null : nombre }));
  }

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-8 font-heading text-3xl text-marca-700">Catálogo</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={selectTodos}
          className={`rounded-full px-4 py-2 text-sm ${
            !filters.grupo && !filters.categoria ? "bg-marca-400 text-white" : "bg-marca-50 text-marca-700"
          }`}
        >
          Todos
        </button>

        {grupos.map((grupo) => (
          <div key={grupo.nombre} className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => selectGrupo(grupo.nombre)}
              className={`rounded-full px-4 py-2 text-sm ${
                filters.grupo === grupo.nombre ? "bg-marca-400 text-white" : "bg-marca-50 text-marca-700"
              }`}
            >
              {grupo.nombre}
            </button>
            {filters.grupo === grupo.nombre &&
              grupo.categorias.map((sub) => (
                <button
                  key={sub}
                  onClick={() => selectCategoria(sub)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    filters.categoria === sub ? "bg-marca-blush text-marca-700" : "bg-marca-cream text-marca-700"
                  }`}
                >
                  {sub}
                </button>
              ))}
          </div>
        ))}

        {sueltas.map((suelta) => (
          <button
            key={suelta}
            onClick={() => selectGrupo(suelta)}
            className={`rounded-full px-4 py-2 text-sm ${
              filters.grupo === suelta ? "bg-marca-400 text-white" : "bg-marca-50 text-marca-700"
            }`}
          >
            {suelta}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PriceRangeSlider
          min={bounds.min}
          max={bounds.max}
          value={[filters.precioMin, filters.precioMax]}
          onChange={([precioMin, precioMax]) => setFilters((f) => ({ ...f, precioMin, precioMax }))}
        />
        <label className="flex items-center gap-2 text-sm text-marca-700">
          <input
            type="checkbox"
            checked={filters.soloDisponibles}
            onChange={(e) => setFilters((f) => ({ ...f, soloDisponibles: e.target.checked }))}
          />
          Solo disponibles
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="py-12 text-center text-neutral-mid">No hay productos que coincidan con los filtros elegidos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visibles.map((producto) => (
              <motion.div
                key={producto.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ProductCard producto={producto} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
```

Note: a "categoría suelta" like "Yerbas" is stored as `categoria === "Yerbas"` with no group — `selectGrupo` doubles as "select this loose category" since `applyFilters` only checks `p.categoria === filters.grupo` when `categoria` is null, matching spec §10's rule ("selecting a group with no subcategory shows all products in that group").

- [ ] **Step 2: Manual browser verification**

Temporarily mount `<Catalogo productos={mockProductos} />` in `page.tsx` with 4-5 mock products spanning groups/sueltas/price range. Confirm: clicking a group reveals its subcategories and filters to that group; clicking "Todos" resets both; price slider narrows results; "Solo disponibles" hides `Sin stock`; empty-filter combination shows the empty-state message; cards animate in/out when filters change.

- [ ] **Step 3: Commit**

```bash
git add src/components/Catalogo.tsx
git commit -m "feat: add catalog section with two-level filters, price range, and animated grid"
```

---

### Task 12: Destacados marquee

**Files:**
- Create: `src/components/Destacados.tsx`

**Interfaces:**
- Consumes: `Producto[]` (already filtered to `destacado === true` by the caller in Task 15).
- Produces: `<Destacados productos={Producto[]} />` — returns `null` when `productos.length === 0` (section must not render at all); otherwise a CSS-only infinite marquee (duplicated track + `animation`) of `ProductCard`s.

- [ ] **Step 1: Implement**

```tsx
// src/components/Destacados.tsx
import ProductCard from "@/components/ProductCard";
import type { Producto } from "@/lib/types";

export default function Destacados({ productos }: { productos: Producto[] }) {
  if (productos.length === 0) return null;

  const track = [...productos, ...productos];

  return (
    <section id="destacados" className="overflow-hidden bg-marca-cream py-16">
      <h2 className="mb-8 text-center font-heading text-3xl text-marca-700">Destacados</h2>
      <div className="marquee flex w-max gap-4 px-4">
        {track.map((producto, i) => (
          <div key={`${producto.id}-${i}`} className="w-64 shrink-0">
            <ProductCard producto={producto} />
          </div>
        ))}
      </div>
    </section>
  );
}
```

Add marquee keyframes to `src/app/globals.css`:

```css
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.marquee {
  animation: marquee-scroll 30s linear infinite;
}
.marquee:hover {
  animation-play-state: paused;
}
```

- [ ] **Step 2: Manual verification**

Mount temporarily with mock destacados (3+ items) — confirm continuous scroll, pauses on hover, and with an empty array the section renders nothing (no empty heading).

- [ ] **Step 3: Commit**

```bash
git add src/components/Destacados.tsx src/app/globals.css
git commit -m "feat: add destacados marquee section, hidden when empty"
```

---

### Task 13: Footer

**Files:**
- Create: `src/components/Footer.tsx`

**Interfaces:**
- Consumes: `siteConfig` (Task 3), `buildContactoLink` (Task 4).
- Produces: `<Footer />`, id `contacto`.

- [ ] **Step 1: Implement**

```tsx
// src/components/Footer.tsx
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { buildContactoLink } from "@/lib/whatsapp";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contacto" className="bg-marca-cream px-4 py-12 text-marca-700">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <Image src="/logo.png" alt={siteConfig.brandName} width={64} height={64} className="h-16 w-auto" />

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
          <a
            href={`https://instagram.com/${siteConfig.instagramHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-marca-400"
          >
            📷 {siteConfig.instagramHandle}
          </a>
          <a href={buildContactoLink()} target="_blank" rel="noopener noreferrer" className="hover:text-marca-400">
            💬 WhatsApp
          </a>
          <span>📍 {siteConfig.city}</span>
        </div>

        <p className="text-sm text-neutral-mid">© {year} {siteConfig.brandName}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Manual verification**

Confirm cream background contrasts with the section above it, Instagram link opens the right profile, WhatsApp link opens `wa.me` with no prefilled text, year is the current year.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: add footer with contact links and dynamic copyright year"
```

---

### Task 14: Assemble the landing page with live Supabase data

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `createBrowserClient` — actually for a server component we need a plain anon fetch; add a small server-side query helper.
- Produces: full `page.tsx` fetching `productos` server-side with `revalidate = 0`, passing filtered slices to `Destacados` and `Catalogo`.

- [ ] **Step 1: Add a server-side product fetch helper**

```ts
// src/lib/products.ts
import { createClient } from "@supabase/supabase-js";
import type { Producto } from "@/lib/types";

export async function fetchProductos(): Promise<Producto[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("orden_display", { ascending: true });

  if (error) throw error;
  return data as Producto[];
}
```

- [ ] **Step 2: Assemble page.tsx**

```tsx
// src/app/page.tsx
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Destacados from "@/components/Destacados";
import Catalogo from "@/components/Catalogo";
import Footer from "@/components/Footer";
import { fetchProductos } from "@/lib/products";

export const revalidate = 0;

export default async function Home() {
  const productos = await fetchProductos();
  const destacados = productos.filter((p) => p.destacado);

  return (
    <main>
      <Navbar />
      <Hero />
      <Destacados productos={destacados} />
      <Catalogo productos={productos} />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 3: Manual verification (requires .env.local with real Supabase creds)**

Once the user has completed the manual Supabase setup (Task 6 README) and added a few test rows to `productos` via the Supabase table editor, run:

```bash
npm run dev
```

Confirm: landing loads real products, destacados marquee shows only `destacado = true` rows (or hides if none), editing a row's `precio` in the Supabase dashboard and refreshing the page reflects the change immediately (no stale cache).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/lib/products.ts
git commit -m "feat: assemble landing page with live, non-cached product data"
```

---

### Task 15: Image compression utility for admin uploads

**Files:**
- Create: `src/lib/image-compress.ts`

**Interfaces:**
- Produces: `compressToWebp(file: File): Promise<File>` — resizes/compresses in-browser before upload.

- [ ] **Step 1: Implement**

```ts
// src/lib/image-compress.ts
import imageCompression from "browser-image-compression";

export async function compressToWebp(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1200,
    fileType: "image/webp",
    useWebWorker: true,
  });
}
```

- [ ] **Step 2: Manual verification**

This gets exercised end-to-end in Task 18 (admin form). No standalone test — `browser-image-compression` requires a real `File`/canvas environment that jsdom does not provide reliably; verifying it through the actual upload flow is more meaningful than mocking the library.

- [ ] **Step 3: Commit**

```bash
git add src/lib/image-compress.ts
git commit -m "feat: add client-side webp image compression helper for admin uploads"
```

---

### Task 16: Auth middleware for /admin

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `createServerClient` pattern (Task 6), adapted for middleware's `NextRequest`/`NextResponse`.
- Produces: middleware redirecting any `/admin/*` request (except `/admin/login`) to `/admin/login` when there's no Supabase session.

- [ ] **Step 1: Implement**

```ts
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Manual verification**

With no session, visiting `http://localhost:3000/admin` redirects to `/admin/login`. `/admin/login` itself loads without redirect loop.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: gate /admin routes behind supabase auth session"
```

---

### Task 17: Admin login page

**Files:**
- Create: `src/components/admin/LoginForm.tsx`
- Create: `src/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `createBrowserClient` (Task 6).
- Produces: `<LoginForm />` client component, email+password, calls `supabase.auth.signInWithPassword`, redirects to `/admin` on success, shows inline error on failure.

- [ ] **Step 1: Implement LoginForm**

```tsx
// src/components/admin/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-lg border border-neutral-light px-4 py-2"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="rounded-lg border border-neutral-light px-4 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-marca-400 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Implement login page**

```tsx
// src/app/admin/login/page.tsx
import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-marca-cream px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center font-heading text-2xl text-marca-700">Panel Admin</h1>
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Manual verification**

Requires the user's manually-created Supabase Auth user (Task 6 README step 4). Log in with correct credentials → redirected to `/admin`. Log in with wrong password → inline error, no redirect.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/LoginForm.tsx src/app/admin/login/page.tsx
git commit -m "feat: add admin login page"
```

---

### Task 18: Admin layout and product list (grouped, drag reorder)

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/admin/ProductList.tsx`
- Create: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `Producto[]`, `getVisibleGrupos`/`getVisibleSueltas` (Task 5, reused — admin uses "same grouping/empty rule" per spec §6), `@dnd-kit/core` + `@dnd-kit/sortable`.
- Produces: `<ProductList productos={Producto[]} onReorder={(ids: string[]) => void} onToggleDestacado={(id: string) => void} onChangeEstado={(id: string, estado: Estado) => void} onEdit={(producto: Producto) => void} onDelete={(id: string) => void} />`.

- [ ] **Step 1: Implement admin layout (just a shell, auth already enforced by middleware)**

```tsx
// src/app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-marca-cream">{children}</div>;
}
```

- [ ] **Step 2: Implement ProductList with dnd-kit**

```tsx
// src/components/admin/ProductList.tsx
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { Producto, Estado } from "@/lib/types";
import { getVisibleGrupos, getVisibleSueltas } from "@/lib/filters";

interface Props {
  productos: Producto[];
  onReorder: (categoria: string, orderedIds: string[]) => void;
  onToggleDestacado: (id: string) => void;
  onChangeEstado: (id: string, estado: Estado) => void;
  onEdit: (producto: Producto) => void;
  onDelete: (id: string) => void;
}

function Row({ producto, onToggleDestacado, onChangeEstado, onEdit, onDelete }: Omit<Props, "productos" | "onReorder"> & { producto: Producto }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: producto.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 border-b border-neutral-light bg-white p-3">
      <button {...attributes} {...listeners} className="cursor-grab px-1 text-neutral-mid" aria-label="Reordenar">
        ⠿
      </button>
      {producto.imagen_url ? (
        <Image src={producto.imagen_url} alt={producto.nombre} width={48} height={48} className="h-12 w-12 rounded object-cover" />
      ) : (
        <div className="h-12 w-12 rounded bg-marca-50" />
      )}
      <span className="flex-1 truncate">{producto.nombre}</span>
      <span className="w-20 text-right">${producto.precio.toLocaleString("es-AR")}</span>
      <button onClick={() => onToggleDestacado(producto.id)} aria-label="Destacado">
        {producto.destacado ? "⭐" : "☆"}
      </button>
      <select
        value={producto.estado}
        onChange={(e) => onChangeEstado(producto.id, e.target.value as Estado)}
        className="rounded border border-neutral-light px-2 py-1 text-sm"
      >
        <option value="Disponible">Disponible</option>
        <option value="Sin stock">Sin stock</option>
      </select>
      <button onClick={() => onEdit(producto)} className="text-sm text-marca-400">Editar</button>
      <button
        onClick={() => {
          if (confirm(`¿Eliminar "${producto.nombre}"?`)) onDelete(producto.id);
        }}
        className="text-sm text-red-600"
      >
        Eliminar
      </button>
    </div>
  );
}

export default function ProductList({ productos, onReorder, onToggleDestacado, onChangeEstado, onEdit, onDelete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));
  const grupos = getVisibleGrupos(productos);
  const sueltas = getVisibleSueltas(productos);

  function productosDe(categoria: string) {
    return productos.filter((p) => p.categoria === categoria).sort((a, b) => a.orden_display - b.orden_display);
  }

  function handleDragEnd(categoria: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = productosDe(categoria);
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(categoria, reordered.map((p) => p.id));
  }

  const categoriasConProductos = [
    ...grupos.flatMap((g) => g.categorias),
    ...sueltas,
  ];

  return (
    <div className="flex flex-col gap-8 p-4">
      {categoriasConProductos.map((categoria) => {
        const items = productosDe(categoria);
        if (items.length === 0) return null;
        return (
          <div key={categoria}>
            <h3 className="mb-2 font-heading text-lg text-marca-700">{categoria}</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(categoria, e)}>
              <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {items.map((producto) => (
                  <Row
                    key={producto.id}
                    producto={producto}
                    onToggleDestacado={onToggleDestacado}
                    onChangeEstado={onChangeEstado}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
}
```

Note: `productos.filter((p) => p.categoria === categoria)` groups by the *subcategoria within a grupo* using `categoria` field ambiguity — see spec's data model where a grupo's subcategory is stored in `subcategoria` and the grupo name in `categoria`. Correct this by grouping sub-rows on `subcategoria` for grupo entries and on `categoria` for sueltas: replace `productosDe` with:

```ts
function productosDe(categoria: string) {
  return productos
    .filter((p) => p.subcategoria === categoria || (p.categoria === categoria && p.subcategoria === categoria))
    .sort((a, b) => a.orden_display - b.orden_display);
}
```

Actually the clean fix: sueltas store `subcategoria = categoria` too (see Task 19 form — for a suelta, subcategoria mirrors categoria). Use `p.subcategoria === categoria` uniformly for both grupo subcategories and sueltas. Apply that single-condition version in the file instead of the two written above.

- [ ] **Step 3: Wire up admin page.tsx with client-side fetch + mutation handlers**

```tsx
// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Producto, Estado } from "@/lib/types";
import ProductList from "@/components/admin/ProductList";
import ProductFormModal from "@/components/admin/ProductFormModal";

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editing, setEditing] = useState<Producto | null | "new">(null);
  const supabase = createBrowserClient();

  async function reload() {
    const { data } = await supabase.from("productos").select("*").order("orden_display", { ascending: true });
    setProductos((data as Producto[]) ?? []);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleReorder(categoria: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => supabase.from("productos").update({ orden_display: index }).eq("id", id))
    );
    reload();
  }

  async function handleToggleDestacado(id: string) {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;
    await supabase.from("productos").update({ destacado: !producto.destacado }).eq("id", id);
    reload();
  }

  async function handleChangeEstado(id: string, estado: Estado) {
    await supabase.from("productos").update({ estado }).eq("id", id);
    reload();
  }

  async function handleDelete(id: string) {
    await supabase.from("productos").delete().eq("id", id);
    reload();
  }

  return (
    <main>
      <div className="flex items-center justify-between p-4">
        <h1 className="font-heading text-2xl text-marca-700">Productos</h1>
        <button onClick={() => setEditing("new")} className="rounded-lg bg-marca-400 px-4 py-2 text-white">
          Nuevo producto
        </button>
      </div>

      <ProductList
        productos={productos}
        onReorder={handleReorder}
        onToggleDestacado={handleToggleDestacado}
        onChangeEstado={handleChangeEstado}
        onEdit={(producto) => setEditing(producto)}
        onDelete={handleDelete}
      />

      {editing && (
        <ProductFormModal
          producto={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 4: Manual verification**

Requires a logged-in session and a few existing rows. Confirm: rows grouped by subcategory/loose-category and hidden groups with 0 rows don't appear; dragging a row within its group persists the new `orden_display` after reload; star toggles `destacado`; estado select updates immediately; delete asks for confirmation and removes the row.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/page.tsx src/components/admin/ProductList.tsx
git commit -m "feat: add admin product list with grouping, drag reorder, and inline actions"
```

---

### Task 19: Admin product form modal (create/edit + image upload)

**Files:**
- Create: `src/components/admin/ProductFormModal.tsx`

**Interfaces:**
- Consumes: `Producto`, `Estado` (Task 3), `GRUPOS`/`SUELTAS` (Task 3), `compressToWebp` (Task 15), `createBrowserClient` (Task 6).
- Produces: `<ProductFormModal producto={Producto | null} onClose={() => void} onSaved={() => void} />`.

- [ ] **Step 1: Implement**

```tsx
// src/components/admin/ProductFormModal.tsx
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
```

- [ ] **Step 2: Manual verification**

Create a new product with an image → confirm it's compressed (check network tab upload size is small, file is `.webp`), appears in Storage bucket, and shows up on both `/admin` and the public landing after refresh. Edit an existing product's price → confirm it updates in place. Select a grupo → subcategoria select appears and is required; select a suelta → no subcategoria select, and the row saves with `subcategoria === categoria`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ProductFormModal.tsx
git commit -m "feat: add admin product create/edit form with image compression and upload"
```

---

### Task 20: End-to-end verification and deploy docs

**Files:**
- Modify: `README.md`

**Interfaces:**
- None (documentation + full manual QA pass).

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: all unit tests pass (categories, whatsapp, filters).

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Full manual QA pass in browser**

With real Supabase data (at least: one product per grupo subcategory, one loose-category product, one `destacado`, one `Sin stock`, price spread across a wide range):
- Landing: navbar links scroll to sections, hero parallax, destacados marquee shows only destacado items, catalog filters/price/toggle all behave per spec §10, WhatsApp buttons on cards and footer both work, footer contrast is legible.
- Admin: login/logout, create/edit/delete product, drag-reorder within a category persists after refresh, star toggle, estado select, image upload compresses and previews.
- Confirm no fixed floating WhatsApp button anywhere.

- [ ] **Step 4: Write deploy section in README**

```markdown
## Deploy

1. Crear repo en GitHub y pushear esta carpeta.
2. Conectar el repo en Vercel (Hobby plan requiere que el repo sea personal o público si es de una organización).
3. Agregar env vars en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Después del primer deploy, agregar la URL de Vercel en Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).
```

- [ ] **Step 5: Final commit**

```bash
git add README.md
git commit -m "docs: add deploy instructions"
```

---

## Self-Review Notes

- **Spec coverage:** §1-11 all mapped to tasks above. §4 (categorías) resolved via user confirmation, embedded in Global Constraints and Task 3. §10 lessons (stale cache → Task 14 `revalidate = 0`; "Todos" independent → Task 11 `selectTodos`; grupo-without-subcategoria → Task 5 `applyFilters` test; batching race → Task 11 `selectGrupo` comment; no upscaling → `next/image` usage without forcing larger `width`/`height` than source) each have an explicit task/test.
- **Known rough edge flagged inline:** Task 18's `productosDe` grouping key was corrected mid-task to use `subcategoria` uniformly (grupo subcategories and sueltas both group on `subcategoria`, since Task 19's form sets `subcategoria = categoria` for sueltas) — implementer should write the corrected single-line version directly, not the first draft shown for context.
- **Supabase provisioning:** intentionally left manual (user's explicit choice), all instructions live in README + migration SQL file rather than as executable MCP steps.
