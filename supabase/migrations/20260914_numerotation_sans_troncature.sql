-- 14/09/2026 — La numérotation rebouclait au 1000e document de l'année.
--
-- Ce qui s'est passé. `LPAD(chaîne, 3, '0')` ne se contente pas de compléter :
-- il TRONQUE quand la chaîne dépasse la longueur demandée. `LPAD('1000',3,'0')`
-- vaut donc '100'. La séquence, elle, était juste — `document_sequences.last_seq`
-- valait bien 1002 — c'est le formatage qui perdait un chiffre. À partir du
-- 1000e document d'une même année, les numéros repartaient donc sur 100, 101,
-- 102… et retombaient sur des numéros déjà émis.
--
-- Comment on l'a vu. Pas par une relecture : la Plateforme Agréée a refusé une
-- émission avec « La facture est déjà existante (id 489868) ». Deux factures
-- « 2026-100 » coexistaient en base, à cinq jours d'intervalle.
--
-- Pourquoi ça compte. Article 242 nonies A du CGI : la numérotation des
-- factures doit être continue, chronologique et sans doublon. Et au-delà du
-- droit, un émetteur qui dépasse 999 factures dans l'année ne peut plus
-- transmettre du tout — sans qu'aucun message ne lui dise pourquoi.
--
-- La correction porte sur les trois compteurs (factures, devis, acomptes) :
-- le remplissage à trois chiffres ne s'applique plus qu'en deçà de 1000.

CREATE OR REPLACE FUNCTION public.formater_seq(p_seq INT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_seq < 1000 THEN LPAD(p_seq::TEXT, 3, '0') ELSE p_seq::TEXT END;
$$;

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_seq  INT  := next_document_seq(p_user_id, 'invoice');
BEGIN
  RETURN v_year || '-' || formater_seq(v_seq);
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_proposal_number(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_seq  INT  := next_document_seq(p_user_id, 'proposal');
BEGIN
  RETURN 'D-' || v_year || '-' || formater_seq(v_seq);
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_acompte_number(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_seq  INT  := next_document_seq(p_user_id, 'invoice_acompte');
BEGIN
  RETURN 'AC-' || v_year || '-' || formater_seq(v_seq);
END;
$function$;

-- Le garde. Un doublon de numéro doit échouer à l'écriture, pas être découvert
-- chez un tiers des jours plus tard. Index partiel : un brouillon sans numéro
-- reste possible.
--
-- ⚠️ Il n'y a volontairement PAS d'index équivalent sur `proposals` : le compte
-- de Selim porte deux « D-2026-001 », séquelle du repli silencieux de l'été
-- (voir ARCHIVE.md, saga de la numérotation). Renuméroter un devis SIGNÉ est
-- une décision qui lui revient ; l'index sera posé ensuite.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_numero_unique_par_espace
  ON public.invoices (user_id, invoice_number)
  WHERE invoice_number IS NOT NULL;
