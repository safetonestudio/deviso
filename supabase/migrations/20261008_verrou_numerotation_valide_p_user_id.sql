-- P3 : les RPC de numerotation faisaient confiance au p_user_id passe en argument.
-- Un utilisateur connecte pouvait appeler /rest/v1/rpc/next_invoice_number avec
-- l'UUID d'un autre espace et bruler son compteur. On valide desormais p_user_id
-- contre les espaces reellement accessibles a l'appelant (accessible_workspace_ids).
-- auth.uid() IS NULL = appel serveur (service_role / cron / admin) donc de confiance.

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year   TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_numero TEXT;
  v_essais INT  := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_user_id NOT IN (SELECT accessible_workspace_ids()) THEN
    RAISE EXCEPTION 'Numerotation refusee : espace % non autorise', p_user_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  LOOP
    v_numero := v_year || '-' || formater_seq(next_document_seq(p_user_id, 'invoice'));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invoices WHERE user_id = p_user_id AND invoice_number = v_numero);
    v_essais := v_essais + 1;
    IF v_essais > 1000 THEN
      RAISE EXCEPTION 'Numerotation facture bloquee pour % : 1000 numeros consecutifs deja pris', p_user_id;
    END IF;
  END LOOP;
  RETURN v_numero;
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_acompte_number(p_user_id uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year   TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_numero TEXT;
  v_essais INT  := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_user_id NOT IN (SELECT accessible_workspace_ids()) THEN
    RAISE EXCEPTION 'Numerotation refusee : espace % non autorise', p_user_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  LOOP
    v_numero := 'AC-' || v_year || '-' || formater_seq(next_document_seq(p_user_id, 'invoice_acompte'));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invoices WHERE user_id = p_user_id AND invoice_number = v_numero);
    v_essais := v_essais + 1;
    IF v_essais > 1000 THEN
      RAISE EXCEPTION 'Numerotation acompte bloquee pour % : 1000 numeros consecutifs deja pris', p_user_id;
    END IF;
  END LOOP;
  RETURN v_numero;
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_proposal_number(p_user_id uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year   TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_numero TEXT;
  v_essais INT  := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_user_id NOT IN (SELECT accessible_workspace_ids()) THEN
    RAISE EXCEPTION 'Numerotation refusee : espace % non autorise', p_user_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  LOOP
    v_numero := 'D-' || v_year || '-' || formater_seq(next_document_seq(p_user_id, 'proposal'));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM proposals WHERE user_id = p_user_id AND proposal_number = v_numero);
    v_essais := v_essais + 1;
    IF v_essais > 1000 THEN
      RAISE EXCEPTION 'Numerotation devis bloquee pour % : 1000 numeros consecutifs deja pris', p_user_id;
    END IF;
  END LOOP;
  RETURN v_numero;
END;
$function$;

-- next_document_seq n'est appelee qu'en interne par les trois fonctions ci-dessus.
-- On la retire de l'API REST exposee ; les appels internes passent par le
-- proprietaire (postgres) et restent intacts.
REVOKE EXECUTE ON FUNCTION public.next_document_seq(uuid, text) FROM authenticated, anon;
