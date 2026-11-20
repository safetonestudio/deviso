"use client";

/**
 * Bouton « Demander au client » posé sur une anomalie de la fiche dossier
 * (20/11/2026). Il prépare un message reprenant l'anomalie et ouvre l'onglet
 * Messages, où le cabinet relit et envoie : rien ne part sans son clic.
 * Le brouillon passe par sessionStorage parce que l'onglet Messages n'est
 * monté qu'à son ouverture.
 */
export const cleBrouillon = (clientId: string) => `deviso-signalement-brouillon:${clientId}`;

export function DemanderAuClient({ clientId, anomalie }: { clientId: string; anomalie: string }) {
  function preparer() {
    const texte = `Bonjour, en revoyant votre dossier, j'ai relevé ce point : ${anomalie}. Pouvez-vous le régulariser ? Merci.`;
    try {
      sessionStorage.setItem(cleBrouillon(clientId), texte);
    } catch {
      /* stockage indisponible : l'onglet s'ouvre quand même, message vide */
    }
    window.location.hash = "messages";
  }

  return (
    <button
      type="button"
      onClick={preparer}
      className="shrink-0 text-[13px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
    >
      Demander au client
    </button>
  );
}
