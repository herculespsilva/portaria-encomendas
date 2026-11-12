-- Já aplicada no projeto Supabase "portaria-encomendas" (sueehlpexhtujxlbrlqh).
create extension if not exists pg_trgm with schema extensions;

create table public.apartamentos (
  id uuid primary key default gen_random_uuid(),
  bloco text,
  numero text not null,
  criado_em timestamptz not null default now(),
  unique (bloco, numero)
);

create table public.moradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  apartamento_id uuid not null references public.apartamentos(id) on delete restrict,
  telefone text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index moradores_apartamento_idx on public.moradores(apartamento_id);
create index moradores_nome_trgm_idx on public.moradores using gin (nome extensions.gin_trgm_ops);

create type public.status_encomenda as enum ('pendente', 'retirada');

create table public.encomendas (
  id uuid primary key default gen_random_uuid(),
  apartamento_id uuid references public.apartamentos(id) on delete set null,
  morador_id uuid references public.moradores(id) on delete set null,
  destinatario_texto text,
  endereco_texto text,
  produto text,
  transportadora text,
  texto_ocr_bruto text,
  foto_url text,
  status public.status_encomenda not null default 'pendente',
  recebida_em timestamptz not null default now(),
  recebida_por uuid references auth.users(id) default auth.uid(),
  retirada_em timestamptz,
  retirada_por text
);
create index encomendas_apartamento_idx on public.encomendas(apartamento_id);
create index encomendas_morador_idx on public.encomendas(morador_id);
create index encomendas_status_idx on public.encomendas(status);
create index encomendas_recebida_por_idx on public.encomendas(recebida_por);

-- Busca aproximada de morador pelo nome lido no OCR
create or replace function public.buscar_moradores(termo text, limite int default 5)
returns table (morador_id uuid, nome text, apartamento_id uuid, bloco text, numero text, similaridade real)
language sql stable
set search_path = public, extensions
as $$
  select m.id, m.nome, a.id, a.bloco, a.numero, similarity(m.nome, termo)
  from public.moradores m
  join public.apartamentos a on a.id = m.apartamento_id
  where m.ativo and m.nome % termo
  order by similarity(m.nome, termo) desc
  limit limite;
$$;

-- RLS: apenas usuários autenticados (porteiros) acessam
alter table public.apartamentos enable row level security;
alter table public.moradores enable row level security;
alter table public.encomendas enable row level security;

create policy "autenticados leem apartamentos" on public.apartamentos for select to authenticated using (true);
create policy "autenticados gerenciam apartamentos" on public.apartamentos for all to authenticated using (true) with check (true);
create policy "autenticados gerenciam moradores" on public.moradores for all to authenticated using (true) with check (true);
create policy "autenticados gerenciam encomendas" on public.encomendas for all to authenticated using (true) with check (true);
