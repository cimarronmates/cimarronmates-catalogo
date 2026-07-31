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
