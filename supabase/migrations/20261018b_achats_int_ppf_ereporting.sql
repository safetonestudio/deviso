-- Un 200 sur POST /b2bint_invoices signifie que la Plateforme Agreee a STOCKE
-- la declaration d'achat, pas qu'elle l'a envoyee a l'administration (envoi
-- differe, selon le calendrier du regime de TVA). ppf_ereporting_id, en lecture
-- seule cote API (spec v1.37), n'apparait qu'a l'envoi effectif au PPF : c'est
-- lui, et lui seul, qui autorise l'ecran a afficher « Declare ».
alter table public.superpdp_achats_int
  add column if not exists ppf_ereporting_id integer,
  add column if not exists declared_at timestamptz;
