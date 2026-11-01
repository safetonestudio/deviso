-- 01/11/2026 — Cockpit cabinet : un comptable suit PLUSIEURS clients.
--
-- 1) L'index d'unicite d'appartenance active supposait une personne active dans
--    au plus un espace. Vrai pour un vrai membre d'equipe, FAUX pour un
--    comptable : un cabinet suit plusieurs clients, donc plusieurs lignes
--    actives avec le meme member_id. On restreint l'unicite aux non-comptables.
DROP INDEX IF EXISTS public.team_members_membre_actif_unique;
CREATE UNIQUE INDEX IF NOT EXISTS team_members_membre_actif_unique
  ON public.team_members (member_id)
  WHERE member_id IS NOT NULL AND status = 'active' AND role <> 'comptable';

-- 2) Invitations cabinet a usage unique. Le cabinet genere un code par client
--    depuis son cockpit ; le client le saisit une fois, le lien team_members
--    reel est cree cote serveur et l'invitation passe a "claimed". Le code vit
--    dans sa propre table, jamais dans le compte client.
CREATE TABLE IF NOT EXISTS public.cabinet_invitations (
  id          uuid primary key default gen_random_uuid(),
  cabinet_id  uuid not null references auth.users on delete cascade,
  code        text not null unique,
  libelle     text,
  status      text not null default 'pending' check (status in ('pending','claimed','revoked')),
  claimed_by  uuid references auth.users on delete set null,
  created_at  timestamptz not null default now(),
  claimed_at  timestamptz,
  expires_at  timestamptz
);
CREATE INDEX IF NOT EXISTS cabinet_invitations_cabinet ON public.cabinet_invitations (cabinet_id);

ALTER TABLE public.cabinet_invitations ENABLE ROW LEVEL SECURITY;

-- Le cabinet voit et gere ses propres invitations. La consommation d'un code
-- (claim) passe par le client admin cote serveur, hors RLS.
DROP POLICY IF EXISTS cabinet_invitations_proprietaire ON public.cabinet_invitations;
CREATE POLICY cabinet_invitations_proprietaire ON public.cabinet_invitations
  FOR ALL TO authenticated
  USING (cabinet_id = auth.uid())
  WITH CHECK (cabinet_id = auth.uid());
