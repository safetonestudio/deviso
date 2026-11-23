/**
 * Les questions qu'on se pose avant de payer. Chaque réponse s'appuie sur
 * une source du dépôt : CGU (résiliation), lib/plans.ts (fonctions),
 * lib/statut-entreprise.ts (statuts), accès comptable (team_members).
 */
const QUESTIONS = [
  {
    q: "Que se passe-t-il à la fin de l'essai ?",
    r: "Aucun prélèvement : sans carte enregistrée, l'abonnement ne démarre pas et l'accès à votre espace s'arrête. Vous pouvez vous abonner plus tard, quand vous le souhaitez.",
  },
  {
    q: "Puis-je récupérer mes données ?",
    r: "Oui, à tout moment. Vos factures restent téléchargeables en PDF Factur-X, et vous exportez votre comptabilité au format FEC et en CSV.",
  },
  {
    q: "Deviso convient-il à mon entreprise ?",
    r: "Oui. Société (SARL, SAS, EURL, SASU), entreprise individuelle au réel ou micro-entreprise, assujettie à la TVA ou en franchise en base : vous indiquez le statut de votre entreprise, et le tableau de bord, la TVA et les échéances s'y adaptent.",
  },
  {
    q: "Mon comptable peut-il y accéder ?",
    r: "Oui, gratuitement et sans occuper de place parmi vos utilisateurs. Il consulte tout en lecture seule et récupère l'export FEC lui-même.",
  },
  {
    q: "Puis-je facturer en anglais ou à l'étranger ?",
    r: "Oui. Vos factures peuvent être rédigées en anglais pour vos clients étrangers, et vos ventes comme vos achats à l'international suivent les règles de TVA qui s'appliquent.",
  },
  {
    q: "Mes clients ont-ils besoin d'un compte pour signer ?",
    r: "Non. Ils reçoivent un lien, ouvrent le devis sur leur téléphone ou leur ordinateur et signent, sans rien installer ni créer de compte.",
  },
];

export function FaqAccueil({ titre }: { titre: string }) {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <h2 id="titre-faq" className={`reveal lg:col-span-5 ${titre}`}>
        Vos questions, avant de commencer.
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
