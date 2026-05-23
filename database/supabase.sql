-- Estrutura futura para Supabase/PostgreSQL.
-- Use quando o sistema deixar de usar apenas LocalStorage.

create table if not exists matrizes (
  id uuid primary key default gen_random_uuid(),
  brinco text unique not null,
  lote text,
  historico jsonb default '[]'::jsonb,
  partos jsonb default '[]'::jsonb,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);
