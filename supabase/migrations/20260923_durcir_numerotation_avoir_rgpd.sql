-- 23/09/2026 — Audit complet, round 1. Trois durcissements en base.

-- 1) Numérotation cross-tenant. next_document_seq est SECURITY DEFINER et
-- exécutable par `authenticated` : sans contrôle, un utilisateur connecté
-- pouvait appeler la RPC avec le p_user_id d'autrui et trouer sa numérotation
-- (art. 242 nonies A). On exige que l'espace visé soit accessible à l'appelant.
-- service_role (crons, routes admin) et postgres ne sont pas soumis au contrôle.
CREATE OR REPLACE FUNCTION public.next_document_seq(p_user_id uuid, p_doc_type text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_seq  INT;
BEGIN
  IF auth.role() = 'authenticated'
     AND NOT (p_user_id IN (SELECT accessible_workspace_ids())) THEN
    RAISE EXCEPTION 'Numérotation refusée : espace de travail non accessible';
  END IF;

  INSERT INTO document_sequences (user_id, doc_type, year, last_seq)
  VALUES (p_user_id, p_doc_type, v_year, 1)
  ON CONFLICT (user_id, doc_type, year)
  DO UPDATE SET last_seq = document_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN v_seq;
END;
$function$;

-- 2) Un seul avoir par facture (la garde applicative n'est pas atomique).
CREATE UNIQUE INDEX IF NOT EXISTS invoices_un_seul_avoir_par_facture
  ON public.invoices (linked_invoice_id)
  WHERE invoice_type = 'avoir' AND linked_invoice_id IS NOT NULL;

-- 3) RGPD : created_by référençait auth.users sans ON DELETE (blocage). En SET
-- NULL, supprimer un collaborateur qui a créé des documents ne bloque plus la
-- suppression du compte ; le document est conservé (il appartient à l'espace).
ALTER TABLE public.invoices  DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_created_by_fkey;
ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
