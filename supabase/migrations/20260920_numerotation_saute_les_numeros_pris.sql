-- 20/09/2026 — Un numéro déjà pris faisait échouer la création du document.
--
-- Ce qui s'est passé. L'index unique posé le 14/09 sur (user_id,
-- invoice_number) fait son travail : il refuse un doublon à l'écriture. Mais
-- rien ne garantissait que le numéro sorti du compteur soit libre. Les deux
-- sources — `document_sequences` d'un côté, les numéros réellement présents
-- dans `invoices` de l'autre — peuvent diverger dès qu'une ligne est écrite
-- sans passer par le compteur.
--
-- C'est exactement ce que fait le semis de démonstration
-- (`app/api/demo/start/route.ts`) : il insère une facture d'acompte
-- « AC-2026-001 » en dur, sans toucher au compteur, resté à 0. Le premier
-- acompte que le visiteur crée dans la démo se voit donc attribuer
-- « AC-2026-001 » à son tour, l'index le refuse, et la route répond 500 sans
-- que rien n'explique pourquoi. Constaté sur le compte de démonstration
-- 97b40b47 : ligne AC-2026-001 semée, compteur invoice_acompte à 0.
--
-- Pourquoi ça compte au-delà de la démo. Toute ligne écrite hors compteur
-- produit le même effet : reprise d'historique, import, correction manuelle en
-- base. Le compteur seul ne peut pas savoir ce qui existe déjà.
--
-- La correction. Les trois générateurs avancent jusqu'à trouver un numéro
-- libre au lieu de rendre le premier venu. Le compteur ne recule jamais, la
-- chronologie est préservée (article 242 nonies A du CGI), et un numéro déjà
-- émis est sauté au lieu de produire un doublon ou une erreur opaque.
--
-- Ce que ça ne remplace pas. L'index unique reste le seul garde vrai : entre
-- le SELECT de contrôle et l'INSERT de la facture, une autre transaction peut
-- écrire le même numéro. La boucle évite le cas courant (désynchronisation
-- durable) ; l'index évite le cas rare (course entre deux émissions).

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_year   TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_numero TEXT;
  v_essais INT  := 0;
BEGIN
  LOOP
    v_numero := v_year || '-' || formater_seq(next_document_seq(p_user_id, 'invoice'));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM invoices
      WHERE user_id = p_user_id AND invoice_number = v_numero
    );
    v_essais := v_essais + 1;
    IF v_essais > 1000 THEN
      RAISE EXCEPTION 'Numérotation facture bloquée pour % : 1000 numéros consécutifs déjà pris', p_user_id;
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
  LOOP
    v_numero := 'AC-' || v_year || '-' || formater_seq(next_document_seq(p_user_id, 'invoice_acompte'));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM invoices
      WHERE user_id = p_user_id AND invoice_number = v_numero
    );
    v_essais := v_essais + 1;
    IF v_essais > 1000 THEN
      RAISE EXCEPTION 'Numérotation acompte bloquée pour % : 1000 numéros consécutifs déjà pris', p_user_id;
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
  LOOP
    v_numero := 'D-' || v_year || '-' || formater_seq(next_document_seq(p_user_id, 'proposal'));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM proposals
      WHERE user_id = p_user_id AND proposal_number = v_numero
    );
    v_essais := v_essais + 1;
    IF v_essais > 1000 THEN
      RAISE EXCEPTION 'Numérotation devis bloquée pour % : 1000 numéros consécutifs déjà pris', p_user_id;
    END IF;
  END LOOP;
  RETURN v_numero;
END;
$function$;
