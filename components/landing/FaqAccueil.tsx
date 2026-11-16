/**
 * Les questions qu'on se pose avant de payer. Chaque réponse s'appuie sur
 * une source du dépôt : CGU (résiliation), lib/plans.ts (fonctions),
 * lib/statut-entreprise.ts (statuts), accès comptable (team_members).
 */
const QUESTIONS = [
  {
    q: "Que se passe-t-il à la fin de l'essai ?",
    r: "Rien n'est débité sans ta carte. Si tu n'en enregistres pas, l'abonnement ne démarre pas, et tu peux toujours revenir t'abonner plus tard.",
  },
  {
    q: "Puis-je récupérer mes données ?",
    r: "Oui, à tout moment. Tes factures restent téléchargeables en PDF Factur-X, et tu exportes ta comptabilité au format FEC et en CSV.",
  },
  {
    q: "Deviso convient-il à mon statut ?",
    r: "Micro-entreprise, entreprise individuelle au réel ou société, en franchise de TVA ou assujettie : tu indiques ton statut, et le tableau de bord, la TVA et les échéances s'y adaptent.",
  },
  {
    q: "Mon expert-comptable peut-il y accéder ?",
    r: "Oui, gratuitement et sans occuper de place dans ton équipe. Il consulte tout en lecture seule et récupère l'export FEC lui-même.",
  },
  {
    q: "Qu'est-ce qui change avec la réforme de 2026 ?",
    r: "Les factures entre entreprises devront être électroniques et passer par une plateforme agréée. Deviso produit déjà des factures Factur-X et les transmet pour toi : tu n'as rien à installer.",
  },
  {
    q: "Quelle différence entre Solo et Pro ?",
    r: "Uniquement l'équipe. Solo est fait pour travailler seul ; Pro ajoute des collaborateurs, avec des rôles et la validation des devis : 3 utilisateurs inclus, puis 5 € HT par mois et par personne.",
  },
];

export function FaqAccueil({ titre }: { titre: string }) {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <h2 id="titre-faq" className={`reveal lg:col-span-5 ${titre}`}>
        Tes questions, avant de commencer.
      </h2>
      <div className="lg:col-span-7 grid gap-2">
        {QUESTIONS.map(({ q, r }) => (
          <details key={q} className="group reveal rounded-md bg-ds-surface open:bg-ds-elevated transition-colors">
            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-6 px-6 py-5 text-[17px] sm:text-[20px] font-semibold text-ink rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
              {q}
              <span className="shrink-0 w-6 h-6 relative text-gray-400 group-open:text-ink" aria-hidden="true">
                <span className="absolute left-1/2 top-1/2 w-3.5 h-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
                <span className="absolute left-1/2 top-1/2 w-0.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-transform duration-300 group-open:scale-y-0" />
              </span>
            </summary>
            <p className="px-6 pb-6 -mt-1 text-[17px] leading-relaxed text-gray-300 max-w-[62ch]">{r}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
