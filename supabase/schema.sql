-- Ejecutar en el SQL Editor de Supabase

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

-- Solo usuarios autenticados pueden leer
drop policy if exists "items_select_auth" on public.items;
create policy "items_select_auth" on public.items
  for select to authenticated using (true);

-- Solo el creador puede insertar/eliminar
drop policy if exists "items_insert_own" on public.items;
create policy "items_insert_own" on public.items
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "items_delete_own" on public.items;
create policy "items_delete_own" on public.items
  for delete to authenticated using (auth.uid() = created_by);

-- Tabla de usuarios (perfiles) enlazada a auth.users
create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  email text,
  rol text not null default 'user' check (rol in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- Cada usuario puede leer su propio perfil; los admin pueden leer todos
drop policy if exists "usuarios_select_own" on public.usuarios;
create policy "usuarios_select_own" on public.usuarios
  for select to authenticated using (auth.uid() = id);

drop policy if exists "usuarios_select_admin" on public.usuarios;
create policy "usuarios_select_admin" on public.usuarios
  for select to authenticated using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

-- Cada usuario puede actualizar su propio perfil
drop policy if exists "usuarios_update_own" on public.usuarios;
create policy "usuarios_update_own" on public.usuarios
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Solo se puede insertar vía trigger/service role (no política insert pública)

-- Trigger: crea el perfil automáticamente cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Geocercas dibujadas en el mapa (círculo o polígono)
create table if not exists public.geocercas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  kind text not null check (kind in ('circle', 'polygon')),
  datos jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.geocercas enable row level security;

drop policy if exists "geocercas_select_auth" on public.geocercas;
create policy "geocercas_select_auth" on public.geocercas
  for select to authenticated using (true);

drop policy if exists "geocercas_insert_own" on public.geocercas;
create policy "geocercas_insert_own" on public.geocercas
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "geocercas_delete_own" on public.geocercas;
create policy "geocercas_delete_own" on public.geocercas
  for delete to authenticated using (auth.uid() = created_by);
