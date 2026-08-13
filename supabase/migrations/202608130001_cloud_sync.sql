-- Caderno Musical V1.3: schema pessoal mínimo, idempotente e protegido por RLS.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.study_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.notebook_notes (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, subject text not null default '', body text not null default '',
  tags jsonb not null default '[]'::jsonb, links jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  created_at timestamptz not null, updated_at timestamptz not null,
  primary key (user_id, id)
);
create table if not exists public.atelier_boards (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, schema_version integer not null default 1,
  content jsonb not null,
  created_at timestamptz not null, updated_at timestamptz not null,
  primary key (user_id, id)
);
create table if not exists public.study_materials (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, subject text not null default '', notes text not null default '', study_date date not null,
  storage_path text not null, file_name text not null, mime_type text not null, size_bytes bigint not null,
  created_at timestamptz not null, updated_at timestamptz not null,
  primary key (user_id, id), unique (storage_path)
);

create index if not exists notebook_notes_user_updated_idx on public.notebook_notes(user_id, updated_at desc);
create index if not exists atelier_boards_user_updated_idx on public.atelier_boards(user_id, updated_at desc);
create index if not exists study_materials_user_updated_idx on public.study_materials(user_id, updated_at desc);

alter table public.study_states enable row level security;
alter table public.notebook_notes enable row level security;
alter table public.atelier_boards enable row level security;
alter table public.study_materials enable row level security;

do $$ declare table_name text; begin
  foreach table_name in array array['study_states','notebook_notes','atelier_boards','study_materials'] loop
    execute format('drop policy if exists "own_select" on public.%I', table_name);
    execute format('drop policy if exists "own_insert" on public.%I', table_name);
    execute format('drop policy if exists "own_update" on public.%I', table_name);
    execute format('drop policy if exists "own_delete" on public.%I', table_name);
    execute format('create policy "own_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "own_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "own_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "own_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "materials_select" on storage.objects;
drop policy if exists "materials_insert" on storage.objects;
drop policy if exists "materials_update" on storage.objects;
drop policy if exists "materials_delete" on storage.objects;
create policy "materials_select" on storage.objects for select to authenticated using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "materials_insert" on storage.objects for insert to authenticated with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "materials_update" on storage.objects for update to authenticated using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "materials_delete" on storage.objects for delete to authenticated using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));
