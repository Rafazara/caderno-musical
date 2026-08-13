-- Referências estáticas de conceitos relacionadas manualmente a materiais.
alter table public.study_materials add column if not exists concept_refs jsonb not null default '[]'::jsonb;
