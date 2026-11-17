/**
 * La question que se pose tout visiteur : pourquoi payer, quand des outils
 * de facturation gratuits existent ? Trois différences que le parcours
 * au-dessus ne montre pas, chacune vérifiable dans le produit : plateforme
 * agréée comprise dans l'abonnement, accès comptable gratuit en lecture
 * seule, chiffres de déclaration calculés selon le statut. Chaque raison porte
 * la couleur de son sens (bleu : réforme, vert : action, ambre : échéance).
 */
const RAISONS = [
  {
    filet: "bg-blue-400",
    titre: "La réforme, réglée.",
    texte: "Tes factures partent par une plateforme agréée par l'État, comprise dans ton abonnement. Avec la plupart des outils gratuits, il te faut en choisir une, souvent payante, et la relier toi-même.",
  },
  {
    filet: "bg-indigo-500",
    titre: "Ton comptable branché.",
    texte: "Il consulte tes devis, tes factures et tes exports en lecture seule, sans frais. Plus de fichiers à lui envoyer chaque mois.",
  },
  {
    filet: "bg-amber-400",
    titre: "Tes déclarations préparées.",
    texte: "Chiffre d'affaires, TVA et échéances, calculés selon ton statut. Tu sais quoi déclarer, et quand.",
  },
];

export function PourquoiDeviso({ titre }: { titre: string }) {
  return (
    <div>
      <div className="reveal max-w-[760px]">
        <h2 id="titre-pourquoi" className={titre}>
          Ce qu&apos;un outil gratuit ne fait pas.
        </h2>
        <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed text-gray-300">
          Faire une facture, beaucoup d&apos;outils le savent. Deviso s&apos;occupe aussi de ce qu&apos;il y a autour.
        </p>
      </div>
      <ul className="mt-12 sm:mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        {RAISONS.map((r) => (
          <li key={r.titre} className="reveal">
            <span className={`block h-[3px] w-10 rounded-full ${r.filet}`} aria-hidden="true" />
            <h3 className="mt-6 text-[20px] sm:text-[24px] leading-[1.25] font-semibold tracking-[-0.02em] text-ink">{r.titre}</h3>
            <p className="mt-3 text-[17px] leading-relaxed text-gray-300">{r.texte}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
