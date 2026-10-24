-- Télédéclaration URSSAF (API Tierce Déclaration auto-entrepreneur).
--
-- urssaf_tdae_comptes : un mandat par compte Deviso (le titulaire). L'URSSAF
-- n'accepte qu'un tiers déclarant à la fois par SIRET.
-- urssaf_tdae_declarations : journal des déclarations transmises. Jamais
-- modifié ni supprimé par l'application : une redéclaration sur la même
-- période crée une nouvelle ligne (l'URSSAF « annule et remplace »), la
-- précédente reste comme preuve de ce qui a été envoyé.
--
-- La date de naissance demandée par l'URSSAF pour le mandat n'est PAS
-- stockée : elle est saisie au moment du mandat et de sa révocation.

create table if not exists public.urssaf_tdae_comptes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  siret text not null check (siret ~ '^\d{14}$'),
  categorie_ca text not null check (categorie_ca in
    ('caVente','caLocation','caPrestationService','caPrestationAutres','recettesCipav')),
  periodicite text not null check (periodicite in ('M','T')),
  debut_activite date,
  acre boolean,
  mandat_statut text not null check (mandat_statut in ('actif','revoque')),
  mandat_signe_at timestamptz,
  mandat_revoque_at timestamptz,
  mode text not null check (mode in ('simulation','sandbox','production')),
  updated_at timestamptz not null default now()
);

alter table public.urssaf_tdae_comptes enable row level security;

create policy "Owner manages own URSSAF mandate"
  on public.urssaf_tdae_comptes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.urssaf_tdae_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  annee int not null,
  mois int check (mois between 1 and 12),
  trimestre int check (trimestre between 1 and 4),
  categorie_ca text not null,
  encaisse_ht numeric not null,
  montant_declare int not null check (montant_declare >= 0),
  montants jsonb not null,
  cotisations_dues int not null,
  date_exigibilite date not null,
  certificat text not null,
  id_declaration text not null,
  mode text not null check (mode in ('simulation','sandbox','production')),
  constraint urssaf_tdae_periode_unique check ((mois is null) <> (trimestre is null))
);

alter table public.urssaf_tdae_declarations enable row level security;

-- Lecture et ajout seulement : pas de politique update ni delete.
create policy "Owner reads own URSSAF declarations"
  on public.urssaf_tdae_declarations for select
  using (auth.uid() = user_id);

create policy "Owner records own URSSAF declarations"
  on public.urssaf_tdae_declarations for insert
  with check (auth.uid() = user_id);

create index if not exists urssaf_tdae_declarations_user_idx
  on public.urssaf_tdae_declarations (user_id, created_at desc);
