/**
 * La question que se pose tout visiteur : pourquoi payer, quand des outils
 * de facturation gratuits existent ? Trois différences, chacune vérifiable
 * dans le produit (IA sur le catalogue, cycle complet du devis au paiement, accès
 * comptable gratuit en lecture seule).
 */
const RAISONS = [
  {
    teinte: "text-gray-500",
    titre: "Le devis s'écrit à ta place.",
    texte: "Tu décris la mission, l'IA la chiffre à partir de ton catalogue et de tes prix. Tu relis et tu envoies, sans repartir d'une page blanche.",
  },
  {
    teinte: "text-gray-500",
    titre: "Tout le cycle, au même endroit.",
    texte: "Devis, signature, facture conforme, relances, factures de tes fournisseurs : un seul outil suit le dossier du premier mot au paiement.",
  },
  {
    teinte: "text-gray-500",
    titre: "Ton comptable y a accès, gratuitement.",
    texte: "Invite ton expert-comptable en lecture seule. Il retrouve tes factures, tes achats et l'export FEC sans que tu lui envoies quoi que ce soit.",
  },
];

export function PourquoiDeviso({ titre }: { titre: string }) {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="reveal lg:col-span-5">
        <h2 id="titre-pourquoi" className={titre}>
          Ce qu&apos;un outil gratuit ne fait pas.
        </h2>
        <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed text-gray-300 max-w-[40ch]">
          Faire une facture, beaucoup d&apos;outils le savent. Deviso s&apos;occupe aussi de ce qu&apos;il y a avant et après.
        </p>
      </div>
      <ol className="lg:col-span-7 grid gap-10 sm:gap-12">
        {RAISONS.map((r, i) => (
          <li key={r.titre} className="reveal grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr] gap-x-4">
            <span className={`text-[20px] sm:text-[24px] font-semibold tabular-nums leading-[1.3] ${r.teinte}`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-[20px] sm:text-[24px] leading-[1.3] font-semibold tracking-[-0.02em] text-ink">{r.titre}</h3>
              <p className="mt-3 text-[17px] leading-relaxed text-gray-300 max-w-[52ch]">{r.texte}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
