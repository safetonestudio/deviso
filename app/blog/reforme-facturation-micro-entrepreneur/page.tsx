import { PageSite, CADRE_LECTURE, BOUTON_PLEIN } from "@/components/site/PageSite";
import { H1_ARTICLE, H2_ARTICLE, CORPS, CARTE, ENCADRE } from "@/components/blog/styles";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { Signature } from "@/components/blog/Signature";
import { jsonLdArticle, metadonneesArticle } from "@/lib/blog/meta";
import Link from "next/link";
import { CircleX } from "lucide-react";

const SLUG = "reforme-facturation-micro-entrepreneur";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichées sur la page, et balisées en `FAQPage` à partir de cette
 * même liste. Une seule source : un `FAQPage` qui annonce une réponse absente du
 * contenu visible est une déclaration fausse.
 */
const FAQ = [
  {
    q: "Je n'ai qu'un ou deux clients entreprises. Suis-je vraiment obligé ?",
    a: "Oui. L'obligation ne dépend pas du nombre de clients ni du CA. Dès qu'une transaction est B2B (professionnel à professionnel), elle sera soumise à l'e-invoicing à partir de septembre 2027, quel que soit votre volume.",
  },
  {
    q: "Mon client me demande déjà une facture Factur-X. Que faire ?",
    a: "Certains grands groupes anticipent la réforme et demandent des factures Factur-X avant l'obligation légale. Si vous utilisez Deviso, vous pouvez télécharger votre facture en format Factur-X dès maintenant, c'est le format par défaut.",
  },
  {
    q: "Combien va coûter la PDP ?",
    a: "Le prix des PDP varie selon les prestataires. Certains logiciels de facturation incluent l'accès à une PDP dans leur abonnement. Deviso inclut déjà l'accès à une Plateforme Agréée, sans coût supplémentaire pour les utilisateurs Solo et Pro.",
  },
  {
    q: "Est-ce que ça change quelque chose à mes déclarations URSSAF ?",
    a: "Non. Les déclarations URSSAF (cotisations sociales) sont indépendantes de la facturation électronique. La réforme concerne uniquement le format des factures et leur transmission à la DGFiP, pas les cotisations.",
  },
];

export default function ReformeFacturationMicroEntrepreneurPage() {
  return (
    <PageSite actif="/blog">
      <DonneesStructurees donnees={jsonLdArticle(SLUG, FAQ)} />



      <main className={`${CADRE_LECTURE} pt-12 sm:pt-16 pb-24`}>

        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
          <span>/</span>
          <Link href="/blog/facturation-electronique-2026" className="hover:text-ink transition-colors">Réforme 2026</Link>
          <span>/</span>
          <span className="text-gray-400">Micro-entrepreneur</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-indigo-300">Réforme 2026 · Micro-entrepreneur</span>
            <span className="text-xs text-gray-400">7 min · Mis à jour juillet 2026</span>
          </div>
          <h1 className={`${H1_ARTICLE} mb-5`}>
            Micro-entrepreneur : ce que la réforme de facturation 2026 change vraiment pour toi
          </h1>
          <p className="text-[19px] text-gray-300 leading-relaxed">
            La plupart des auto-entrepreneurs croient qu&apos;être en franchise de TVA les exemptent de la réforme. C&apos;est faux. Voici ce qui change concrètement pour toi, et ce que tu dois faire avant septembre 2027.
          </p>
        </div>

        <div className={`space-y-14 ${CORPS}`}>

          {/* Mythe 1 */}
          <section>
            <div className="bg-ds-surface border-l-[3px] border-amber-400 rounded-xl p-6 mb-6">
              <p className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2"><CircleX size={17} className="shrink-0" />Le mythe le plus répandu</p>
              <p className="text-sm text-gray-300">&quot;Je suis en franchise de TVA, donc la facturation électronique ne me concerne pas.&quot;</p>
            </div>
            <div className="bg-ds-surface border-l-[3px] border-indigo-400 rounded-xl p-6">
              <p className="text-sm font-bold text-emerald-400 mb-2">✓ La réalité</p>
              <p className="text-sm text-gray-300">
                La franchise en base de TVA est un <strong className="text-ink">régime fiscal</strong>. La réforme de facturation électronique est une <strong className="text-ink">obligation administrative et fiscale</strong> distincte. Les deux ne sont pas liés. Un micro-entrepreneur en franchise de TVA devra quand même émettre ses factures B2B au format électronique structuré à partir du 1er septembre 2027.
              </p>
            </div>
          </section>

          <section>
            <h2 className={H2_ARTICLE}>Ta situation selon ton type de clients</h2>
            <div className="space-y-4">
              <div className="bg-ds-surface border border-indigo-500/30 rounded-xl p-5">
                <p className="text-sm font-bold text-ink mb-2">Tu factures des entreprises (B2B)</p>
                <p className="text-sm">→ Tu devras émettre tes factures au format <strong className="text-ink">Factur-X</strong> via une PDP à partir du <strong className="text-ink">1er septembre 2027</strong>. Les factures PDF classiques ne seront plus valides pour les transactions B2B.</p>
              </div>
              <div className={`${CARTE} p-5`}>
                <p className="text-sm font-bold text-ink mb-2">Tu factures des particuliers (B2C)</p>
                <p className="text-sm">→ Tu n&apos;es pas concerné par l&apos;e-invoicing (réservé au B2B). En revanche, tu seras concerné par l&apos;<strong className="text-ink">e-reporting</strong> : obligation de transmettre à la DGFiP les données de tes transactions B2C (montants, dates). Même calendrier : septembre 2027.</p>
              </div>
              <div className={`${CARTE} p-5`}>
                <p className="text-sm font-bold text-ink mb-2">Tu factures les deux</p>
                <p className="text-sm">→ Double obligation : e-invoicing pour les clients pros, e-reporting pour les clients particuliers. Concrètement, ton logiciel de facturation s&apos;en occupera automatiquement.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className={H2_ARTICLE}>Ce que la franchise TVA change dans les données de ta facture</h2>
            <p>
              Ta facture Factur-X ne contiendra pas de montant TVA (puisque tu es en franchise). Mais elle devra quand même inclure les <strong className="text-ink">champs TVA</strong> dans ses données structurées, avec le code d&apos;exonération correct : <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm text-xs">E</code> (exempté) et la mention &quot;TVA non applicable - article 293B du CGI&quot;.
            </p>
            <p className="mt-3">
              Ce n&apos;est pas toi qui le gères : c&apos;est ton logiciel de facturation. Deviso détecte ton régime TVA (franchisé) et génère automatiquement la bonne catégorie dans le XML Factur-X. Tu n&apos;as rien à faire.
            </p>
          </section>

          <section>
            <h2 className={H2_ARTICLE}>Le calendrier pour toi, micro-entrepreneur</h2>
            <div className="space-y-4">
              {[
                {
                  date: "Aujourd'hui",
                  action: "Vérifier que ton logiciel génère du Factur-X",
                  detail: "Si tu utilises Deviso, c'est déjà le cas. Si tu utilises Word, Excel ou un autre outil, c'est le moment de changer.",
                  status: "now",
                },
                {
                  date: "Depuis septembre 2026",
                  action: "Recevoir les e-factures de tes fournisseurs",
                  detail: "Tes fournisseurs grandes entreprises (opérateur télécom, expert-comptable corporate...) t'envoient déjà des e-factures. Avec Deviso, tu les reçois et tu peux les ouvrir.",
                  status: "soon",
                },
                {
                  date: "Début 2027",
                  action: "Choisir ta PDP",
                  detail: "Identifie la plateforme agréée par laquelle tu émettras tes factures. Dans la plupart des cas, ce sera intégré à ton logiciel de facturation.",
                  status: "future",
                },
                {
                  date: "1er septembre 2027",
                  action: "Obligation universelle, passer en e-invoicing",
                  detail: "À partir de cette date, toutes tes factures B2B doivent transiter via une PDP. Les factures PDF par email ne sont plus valides fiscalement.",
                  status: "deadline",
                },
              ].map(({ date, action, detail, status }) => (
                <div key={date} className={`rounded-xl p-4 ${
                  status === "now" ? "bg-ds-surface border-l-[3px] border-indigo-400" :
                  status === "soon" ? "bg-ds-surface border-l-[3px] border-amber-400" :
                  status === "deadline" ? "bg-ds-surface border-l-[3px] border-amber-400" :
                  "bg-ds-surface"
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${
                    status === "now" ? "text-emerald-400" :
                    status === "soon" ? "text-amber-400" :
                    status === "deadline" ? "text-red-400" :
                    "text-gray-500"
                  }`}>{date}</p>
                  <p className="text-sm font-medium text-ink">{action}</p>
                  <p className="text-xs text-gray-500 mt-1">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className={H2_ARTICLE}>Le seuil de franchise ne change pas avec la réforme</h2>
            <p>
              Autre point de confusion : certains pensent que la réforme modifie les seuils de franchise TVA. Non. Les seuils restent inchangés :
            </p>
            <div className="mt-4 bg-ds-surface rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Prestation de services BIC :</span></div>
                <div className="text-ink font-semibold">37 500 € / an</div>
                <div><span className="text-gray-500">Activités libérales BNC :</span></div>
                <div className="text-ink font-semibold">37 500 € / an</div>
                <div><span className="text-gray-500">Commerce / hébergement :</span></div>
                <div className="text-ink font-semibold">85 000 € / an</div>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Si tu dépasses ces seuils, tu deviens assujetti à la TVA, mais c&apos;est une question fiscale distincte de la réforme de facturation électronique.
            </p>
          </section>

          <section>
            <h2 className={H2_ARTICLE}>Questions fréquentes des micro-entrepreneurs</h2>
            <div className="space-y-5">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="border-b border-ds-border pb-5 last:border-0">
                  <h3 className="text-sm font-semibold text-ink mb-2">{q}</h3>
                  <p className="text-sm">{a}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Liens cluster */}
        <div className={`mt-14 mb-10 ${ENCADRE.info} p-6`}>
          <p className="text-sm font-semibold text-gray-500 mb-4">Guide réforme 2026, tous les articles</p>
          <div className="space-y-3">
            {[
              { href: "/blog/facturation-electronique-2026", title: "Guide complet réforme facturation électronique 2026" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Comment choisir sa plateforme agréée (PDP)" },
              { href: "/blog/e-reporting-freelance-2026", title: "E-reporting : l'obligation B2C dont personne ne parle" },
              { href: "/blog/checklist-reforme-facturation-2026", title: "Checklist réforme 2026 : êtes-vous prêt ?" },
            ].map(({ href, title }) => (
              <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                <span className="text-indigo-500 group-hover:text-indigo-300 shrink-0">→</span>
                {title}
              </Link>
            ))}
          </div>
        </div>

        <div className={`${CARTE} p-8 sm:p-10 mb-14`}>
          <h2 className={H2_ARTICLE}>Factur-X inclus dans Deviso</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Toutes vos factures Deviso sont déjà au format Factur-X EN 16931, le format requis par la réforme. La mention &ldquo;franchise TVA&rdquo; est gérée automatiquement selon votre régime.
          </p>
          <Link href="/signup" className={BOUTON_PLEIN}>Essayer 14 jours gratuitement</Link>
          <Signature />
        </div>

              </main>
    </PageSite>
  );
}
