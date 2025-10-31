-- Supabase schema for Calculo
create table if not exists public.users (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.calculos (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  titulo text,
  valor_base numeric(12,2),
  data_inicio date,
  data_citacao date,
  data_final date,
  tipo_calculo text,
  resultado numeric(12,2),
  arquivo_pdf_path text,
  arquivo_pdf_url text,
  created_at timestamp with time zone default now()
);

-- RLS optional (disabled for simplicity; using service role in server only)
-- alter table public.users enable row level security;
-- alter table public.calculos enable row level security;
