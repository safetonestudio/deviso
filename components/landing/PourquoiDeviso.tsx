/**
 * La question que se pose tout visiteur : pourquoi payer, quand des outils
 * de facturation gratuits existent ? Trois différences, chacune vérifiable
 * dans le produit : transmission par plateforme agréée comprise dans
 * l'abonnement, devis rédigé à partir du catalogue, relances automatiques.
 * Chaque raison porte la couleur de son sens (bleu : réforme, vert : action,
 * ambre : échéance), sous forme d'un filet en tête de colonne.
 */
const RAISONS = [
  {
    filet: "bg-blue-400",
    titre: "La réforme, réglée.",
    texte: "Deviso se raccorde pour toi à une plateforme agréée par l'État, et tes factures partent par elle. Avec un outil gratuit, c'est à toi d'en trouver une et de la brancher.",
  },
  {
    filet: "bg-indigo-500",
    titre: "Le devis s'écrit à ta place.",
    texte: "Tu décris la mission en une phrase, Deviso la chiffre avec tes prix. Tu relis et tu envoies, sans repartir d'une page blanche.",
  },
  {
    filet: "bg-amber-400",
    titre: "Tes relances partent seules.",
    texte: "À 3, 7 ou 14 jours sans réponse, ton client reçoit un rappel poli. Tu n'écris plus le message gêné de fin de mois.",
  },
];

export function PourquoiDeviso({ titre }: { titre: string }) {
  return (
    <div>
      <div className="reveal grid gap-6 lg:grid-cols-12 lg:gap-16 lg:items-end">
        <h2 id="titre-pourquoi" className={`lg:col-span-5 ${titre}`}>
          Ce qu&apos;un outil gratuit ne fait pas.
        </h2>
        <p className="lg:col-span-7 text-[17px] sm:text-[20px] leading-relaxed text-gray-300 max-w-[48ch]">
          Faire une facture, beaucoup d&apos;outils le savent. Deviso s&apos;occupe aussi de ce qu&apos;il y a avant et après.
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
