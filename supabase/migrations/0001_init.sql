-- =========================================================
-- 0001_init.sql — RUDOS BARBER Inventario
-- Esquema base: perfiles, productos, movimientos, ventas + RLS
-- =========================================================

create type public.movement_type as enum ('Entrada', 'Salida', 'Venta');

-- Perfil visible del usuario autenticado. Supabase Auth ya gestiona
-- credenciales (auth.users); aquí solo guardamos lo que la UI necesita
-- mostrar (usuario/nombre/rol).
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  usuario    text not null unique,
  nombre     text not null,
  rol        text not null default 'Administrador',
  created_at timestamptz not null default now()
);

create table public.products (
  id            bigint generated always as identity primary key,
  descripcion   text not null,
  marca         text not null default '',
  presentacion  text not null default '',
  stock         integer not null default 0 check (stock >= 0),
  stock_minimo  integer not null default 0 check (stock_minimo >= 0),
  precio_venta  numeric(12,2) not null default 0 check (precio_venta >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.movements (
  id         bigint generated always as identity primary key,
  tipo       public.movement_type not null,
  product_id bigint not null references public.products(id) on delete restrict,
  cantidad   integer not null check (cantidad > 0),
  fecha      timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index movements_product_id_idx on public.movements(product_id);
create index movements_fecha_idx on public.movements(fecha desc);

create table public.sales (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete restrict,
  cantidad   integer not null check (cantidad > 0),
  total      numeric(12,2) not null check (total >= 0),
  fecha      timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index sales_product_id_idx on public.sales(product_id);
create index sales_fecha_idx on public.sales(fecha desc);

-- updated_at automático en products
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Auto-crea el profile al registrarse en auth.users. "usuario" y "nombre"
-- caen de vuelta al prefijo del email (ej. admin@rudosbarber.local -> "admin")
-- si no vienen en los metadatos — esto permite crear el primer admin
-- directamente desde el dashboard de Supabase (Authentication -> Add user)
-- sin pasos adicionales.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, usuario, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'usuario', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'rol', 'Administrador')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vista de valorización de inventario, usada por la pantalla de Reportes.
create view public.v_inventory_valuation
with (security_invoker = true) as
select
  id, descripcion, marca, stock, precio_venta,
  (stock * precio_venta)::numeric(14,2) as subtotal
from public.products;

-- =========================================================
-- Row Level Security — single-tenant: cualquier usuario
-- autenticado lee/escribe todo. Sin acceso anónimo.
-- =========================================================
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.movements enable row level security;
alter table public.sales     enable row level security;

-- products: CRUD completo para autenticados
create policy "products_select" on public.products
  for select to authenticated using (true);
create policy "products_insert" on public.products
  for insert to authenticated with check (true);
create policy "products_update" on public.products
  for update to authenticated using (true) with check (true);
create policy "products_delete" on public.products
  for delete to authenticated using (true);

-- movements: bitácora inmutable -> solo select + insert (sin update/delete)
create policy "movements_select" on public.movements
  for select to authenticated using (true);
create policy "movements_insert" on public.movements
  for insert to authenticated with check (true);

-- sales: igual que movements, log inmutable
create policy "sales_select" on public.sales
  for select to authenticated using (true);
create policy "sales_insert" on public.sales
  for insert to authenticated with check (true);

-- profiles: todos pueden ver todos los perfiles (para la pantalla Usuarios);
-- cada quien solo puede insertar/actualizar SU PROPIA fila
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

grant select on public.v_inventory_valuation to authenticated;
