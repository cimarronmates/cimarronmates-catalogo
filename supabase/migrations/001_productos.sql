create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_corta text,
  imagen_url text,
  categoria text not null,
  subcategoria text not null,
  estado text not null default 'Disponible' check (estado in ('Disponible', 'Sin stock')),
  precio integer not null check (precio >= 0),
  destacado boolean not null default false,
  orden_display integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.productos enable row level security;
create policy "lectura publica" on public.productos for select using (true);
create policy "escritura autenticada" on public.productos for all to authenticated using (true);

-- Storage: crear bucket "productos-img" (público en lectura) desde el dashboard de Supabase,
-- o con: insert into storage.buckets (id, name, public) values ('productos-img', 'productos-img', true);

-- Politica de Storage: permitir subida de imagenes solo a usuarios autenticados
-- (correr esto DESPUES de crear el bucket "productos-img" desde el dashboard)
create policy "escritura autenticada en productos-img"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos-img');
