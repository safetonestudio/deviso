-- 01/11/2026 — Cockpit cabinet : journal des acces et exports.
--
-- Le cockpit lit les dossiers clients avec la cle de service (hors RLS). Pour
-- la confiance du cabinet comme du client, chaque consultation de dossier et
-- chaque export est tracee : quel cabinet, quel dossier, quelle action, quand.
-- Ecrit cote serveur par la cle de service ; chaque cabinet ne lit que ses
-- propres lignes.
CREATE TABLE IF NOT EXISTS public.cabinet_journal (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references auth.users on delete cascade,
  client_id   uuid references auth.users on delete set null,
  action      text not null check (action in ('consultation','export_fec','export_csv')),
  details     text,
  created_at  timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS cabinet_journal_cabinet_date
  ON public.cabinet_journal (cabinet_id, created_at desc);

ALTER TABLE public.cabinet_journal ENABLE ROW LEVEL SECURITY;

-- Le cabinet lit son propre journal. Les ecritures passent par la cle de
-- service cote serveur (hors RLS) : pas de politique d'insertion.
DROP POLICY IF EXISTS cabinet_journal_proprietaire ON public.cabinet_journal;
CREATE POLICY cabinet_journal_proprietaire ON public.cabinet_journal
  FOR SELECT TO authenticated
  USING (cabinet_id = auth.uid());
