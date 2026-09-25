-- Achats internationaux (e-reporting des acquisitions auprès de fournisseurs
-- étrangers). Stockage local + suivi de la transmission vers la Plateforme
-- Agréée (Super PDP, endpoint b2bint_invoices, direction "in").
--
-- Table isolée des ventes (superpdp_invoices) car le flux, les champs de
-- saisie et le cycle de transmission diffèrent. RLS propriétaire : seul le
-- propriétaire du compte gère ses achats (fonctionnalité ownerOnly).

create table if not exists public.superpdp_achats_int (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fournisseur_nom text not null,
  fournisseur_pays text not null,
  fournisseur_tva text,
  numero text,
  date_facture date not null,
  categorie text not null check (categorie in ('biens','services')),
  devise text not null default 'EUR',
  montant_ht numeric not null,
  taux_tva numeric not null,
  montant_tva numeric not null,
  superpdp_id bigint,
  transmission_status text not null default 'en_attente'
    check (transmission_status in ('en_attente','transmis','echec')),
  transmission_error text,
  transmitted_at timestamptz
);

alter table public.superpdp_achats_int enable row level security;

create policy "Owner manages own foreign purchases"
  on public.superpdp_achats_int
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists superpdp_achats_int_user_date_idx
  on public.superpdp_achats_int (user_id, date_facture desc);
