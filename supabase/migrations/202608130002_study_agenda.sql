-- Caderno Musical V1.5 — Agenda local-first. Conteúdo complexo fica em JSONB
-- para espelhar o modelo local sem dividir uma aula em várias transações.
create table if not exists public.study_events (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('lesson','study','review')),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('planned','completed','cancelled')),
  schema_version integer not null default 1,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);
create index if not exists study_events_user_start_idx on public.study_events(user_id, start_at);
alter table public.study_events enable row level security;
drop policy if exists "own_select" on public.study_events;
drop policy if exists "own_insert" on public.study_events;
drop policy if exists "own_update" on public.study_events;
drop policy if exists "own_delete" on public.study_events;
create policy "own_select" on public.study_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "own_insert" on public.study_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own_update" on public.study_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own_delete" on public.study_events for delete to authenticated using ((select auth.uid()) = user_id);
