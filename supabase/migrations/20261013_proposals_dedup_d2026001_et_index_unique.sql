-- P2 : doublon D-2026-001 (sequelle du bug de compteur de l'ete 2026).
-- Deux devis SIGNES portaient le meme numero. On renumerote le plus recent
-- (11/08/2026, "Refonte site vitrine", 9900 EUR, id 51ac2857-17ae-4683-b22b-294912c1e588)
-- vers le prochain numero libre D-2026-006. On laisse intact le 27/06 (La Maison Doree).
-- Reversibilite : UPDATE proposals SET proposal_number='D-2026-001' WHERE id=51ac2857...
-- Le compteur document_sequences (proposal/2026) vaut deja 6, donc reste coherent.
UPDATE public.proposals
   SET proposal_number = 'D-2026-006'
 WHERE id = '51ac2857-17ae-4683-b22b-294912c1e588'
   AND proposal_number = 'D-2026-001';

-- Empeche desormais tout doublon de numero de devis (meme classe de bug que
-- l'index unique deja pose sur les factures). Partiel : les brouillons sans
-- numero (proposal_number NULL) restent autorises.
CREATE UNIQUE INDEX IF NOT EXISTS proposals_user_number_unique
    ON public.proposals (user_id, proposal_number)
 WHERE proposal_number IS NOT NULL;
