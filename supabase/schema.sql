-- ============================================================
-- DEVISO — Schéma Supabase
-- Coller dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Extension pour générer des UUIDs
create extension if not exists "pgcrypto";

-- ── Profiles ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  company_name text,
  siret        text,
  address      text,
  email        text,
  phone        text,
  logo_url     text,
  tva_number   text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-créer un profil vide à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Proposals ─────────────────────────────────────────────────────────
create table if not exists public.proposals (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  title           text not null,
  client_name     text,
  client_email    text,
  client_company  text,
  description     text,
  -- Lignes du devis stockées en JSONB
  -- Format: [{ id, description, quantity, unit, unit_price, total }]
  items           jsonb default '[]'::jsonb not null,
  total_ht        numeric(12, 2) default 0,
  tva_rate        numeric(5, 2) default 20,
  total_ttc       numeric(12, 2) default 0,
  status          text default 'draft' check (status in ('draft','sent','viewed','signed','declined')),
  valid_until     date,
  payment_terms   text default '30% à la commande, solde à la livraison',
  notes           text,
  ai_brief        text,        -- Brief original soumis à l'IA
  share_token     text unique default encode(gen_random_bytes(24), 'base64url'),
  signed_at       timestamptz,
  viewed_at       timestamptz,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.proposals enable row level security;

-- L'utilisateur peut tout faire sur ses propres devis
create policy "Users manage their own proposals"
  on public.proposals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- N'importe qui avec le token peut voir le devis (lien de partage client)
create policy "Public share link read access"
  on public.proposals for select
  using (share_token is not null);

-- Auto-update du champ updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger proposals_updated_at
  before update on public.proposals
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── Invoices (Factures électroniques Factur-X) ────────────────────────
create table if not exists public.invoices (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references auth.users on delete cascade not null,
  proposal_id         uuid references public.proposals on delete set null,

  -- Numérotation
  invoice_number      text not null,                 -- ex: "2026-001"

  -- Informations client (mentions obligatoires 2026)
  client_name         text,
  client_email        text,
  client_company      text,
  client_siren        text,                          -- SIREN client (obligatoire B2B sept. 2026)
  client_address      text,
  delivery_address    text,                          -- adresse livraison si différente

  -- Informations vendeur (pré-remplies depuis le profil)
  seller_name         text,
  seller_company      text,
  seller_siren        text,
  seller_address      text,
  seller_tva_number   text,

  -- Lignes de facturation (même format que proposals)
  items               jsonb default '[]'::jsonb not null,
  total_ht            numeric(12, 2) default 0,
  tva_rate            numeric(5, 2) default 20,
  total_ttc           numeric(12, 2) default 0,

  -- Mentions légales 2026
  -- 380 = Facture commerciale, 381 = Avoir, 389 = Autofacturation
  type_code           text default '380',
  -- 'services' | 'goods' | 'mixed'
  operation_category  text default 'services' check (operation_category in ('services', 'goods', 'mixed')),
  -- TVA sur les débits (option article 1693 bis CGI)
  payment_on_debit    boolean default false,

  -- Dates
  issue_date          date not null default current_date,
  due_date            date,
  payment_terms       text default '30 jours net',
  notes               text,

  -- Statut
  status              text default 'draft' check (status in ('draft', 'sent', 'paid', 'cancelled')),

  -- Stockage du PDF Factur-X généré (Supabase Storage)
  facturx_pdf_path    text,

  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

alter table public.invoices enable row level security;

create policy "Users manage their own invoices"
  on public.invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.set_updated_at();

-- Auto-incrément numéro de facture par utilisateur
create or replace function public.next_invoice_number(p_user_id uuid)
returns text as $$
declare
  v_year text := to_char(current_date, 'YYYY');
  v_count int;
begin
  select count(*) + 1 into v_count
  from public.invoices
  where user_id = p_user_id
    and extract(year from created_at) = extract(year from current_date);
  return v_year || '-' || lpad(v_count::text, 3, '0');
end;
$$ language plpgsql security definer;

-- ── Index ──────────────────────────────────────────────────────────────
create index if not exists proposals_user_id_idx on public.proposals(user_id);
create index if not exists proposals_status_idx on public.proposals(status);
create index if not exists proposals_share_token_idx on public.proposals(share_token);
create index if not exists proposals_created_at_idx on public.proposals(created_at desc);
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);
