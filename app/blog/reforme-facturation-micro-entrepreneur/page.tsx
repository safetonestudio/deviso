import { PageSite } from "@/components/site/PageSite";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { Signature } from "@/components/blog/Signature";
import { jsonLdArticle, metadonneesArticle } from "@/lib/blog/meta";
import Link from "next/link";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
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
    q: "Je n'ai qu'un ou deux clients entreprises. Suis-je vraiment obligé ?",
    a: "Oui. L'obligation ne dépend pas du nombre de clients ni du CA. Dès qu'une transaction est B2B (professionnel à professionnel), elle sera soumise à l'e-invoicing à partir de septembre 2027, quel que soit votre volume.",
  },
  {
    q: "Mon client me demande déjà une facture Factur-X. Que faire ?",
    a: "Certains grands groupes anticipent la réforme et demandent des factures Factur-X avant l'obligation légale. Si vous utilisez Deviso, vous pouvez télécharger votre facture en format Factur-X dès maintenant, c'est le format par défaut.",
  },
  {
    q: "Combien va coûter la PDP ?",
    a: "Le prix des PDP varie selon les prestataires. Certains logiciels de facturation incluent l'accès à une PDP dans leur abonnement. Deviso inclut déjà l'accès à une Plateforme Agréée, sans coût supplémentaire pour les utilisateurs Solo et Pro.",
  },
  {
    q: "Est-ce que ça change quelque chose à mes déclarations URSSAF ?",
    a: "Non. Les déclarations URSSAF (cotisations sociales) sont indépendantes de la facturation électronique. La réforme concerne uniquement le format des factures et leur transmission à la DGFiP, pas les cotisations.",
  },
];

export default function ReformeFacturationMicroEntrepreneurPage() {
  return (
    <PageSite actif="/blog">
      <DonneesStructurees donnees={jsonLdArticle(SLUG, FAQ)} />

      <div className="bg-indigo-950/95 backdrop-blur-xs border-b border-indigo-500/20 py-2 px-4 text-center text-sm">
        <span className="text-indigo-300 font-semibold">Réforme 2026&nbsp;:</span>
        <span className="text-gray-300 ml-1.5">Réception des factures électroniques obligatoire depuis le 1<sup>er</sup> septembre 2026, émission au 1<sup>er</sup> septembre 2027 pour les PME, TPE et micro-entreprises.&nbsp;</span>
        <span className="text-indigo-400 font-medium">Deviso émet en Factur-X par la plateforme agréée comprise dans l&apos;abonnement.</span>
      </div>


      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">

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
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">Réforme 2026 · Micro-entrepreneur</span>
            <span className="text-xs text-gray-400">8 min · Mis à jour novembre 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink leading-tight mb-4">
            Micro-entrepreneur : ce que la réforme de facturation 2026 change vraiment pour vous
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            La plupart des auto-entrepreneurs croient qu&apos;être en franchise de TVA les exempte de la réforme. C&apos;est faux. Voici ce qui change concrètement pour vous, et ce que vous devez faire avant septembre 2027. Si vous dirigez une société (SARL, SAS, EURL, SASU), le calendrier est le même : l&apos;obligation de recevoir s&apos;applique déjà, celle d&apos;émettre arrive en septembre 2027 pour les PME et TPE.
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-gray-400 leading-relaxed">

          {/* Mythe 1 */}
          <section>
            <div className="bg-[#241717] border border-red-500/20 rounded-2xl p-6 mb-6">
              <p className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2"><CircleX size={17} className="shrink-0" />Le mythe le plus répandu</p>
              <p className="text-sm text-gray-300">« Je suis en franchise de TVA, donc la facturation électronique ne me concerne pas. »</p>
            </div>
            <div className="bg-[#14211a] border border-emerald-500/20 rounded-2xl p-6">
              <p className="text-sm font-bold text-emerald-400 mb-2">✓ La réalité</p>
              <p className="text-sm text-gray-300">
                La franchise en base de TVA est un <strong className="text-ink">régime fiscal</strong>. La réforme de facturation électronique est une <strong className="text-ink">obligation administrative et fiscale</strong> distincte. Les deux ne sont pas liés. Un micro-entrepreneur en franchise de TVA devra quand même émettre ses factures B2B au format électronique structuré à partir du 1er septembre 2027.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Votre situation selon votre type de clients</h2>
            <div className="space-y-4">
              <div className="bg-ds-surface border border-indigo-500/30 rounded-xl p-5">
                <p className="text-sm font-bold text-ink mb-2">Vous facturez des entreprises (B2B)</p>
                <p className="text-sm">→ Vous devrez émettre vos factures au format <strong className="text-ink">Factur-X</strong> via une PDP à partir du <strong className="text-ink">1er septembre 2027</strong>. Une facture PDF classique ne sera plus conforme pour les transactions B2B.</p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-sm font-bold text-ink mb-2">Vous facturez des particuliers (B2C)</p>
                <p className="text-sm">→ Vous n&apos;êtes pas concerné par l&apos;e-invoicing (réservé au B2B). En revanche, vous serez concerné par l&apos;<strong className="text-ink">e-reporting</strong> : obligation de transmettre à la DGFiP les données de vos transactions B2C (montants, dates). Même calendrier : septembre 2027.</p>
              </div>
              <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                <p className="text-sm font-bold text-ink mb-2">Vous facturez les deux</p>
                <p className="text-sm">→ Double obligation : e-invoicing pour les clients pros, e-reporting pour les clients particuliers. Concrètement, votre logiciel de facturation s&apos;en occupera automatiquement.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Ce que la franchise TVA change dans les données de votre facture</h2>
            <p>
              Votre facture Factur-X ne contiendra pas de montant TVA (puisque vous êtes en franchise). Mais elle devra quand même inclure les <strong className="text-ink">champs TVA</strong> dans ses données structurées, avec le code d&apos;exonération correct : <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm text-xs">E</code> (exempté) et la mention « TVA non applicable, art. 293 B du CGI ».
            </p>
            <p className="mt-3">
              Ce n&apos;est pas vous qui le gérez : c&apos;est votre logiciel de facturation. Deviso détecte votre régime TVA (franchisé) et génère automatiquement la bonne catégorie dans le XML Factur-X. Vous n&apos;avez rien à faire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Le calendrier pour vous, micro-entrepreneur</h2>
            <div className="space-y-4">
              {[
                {
                  date: "Aujourd'hui",
                  action: "Vérifier que votre logiciel génère du Factur-X",
                  detail: "Si vous utilisez Deviso, c'est déjà le cas. Si vous utilisez Word, Excel ou un autre outil, c'est le moment de changer.",
                  status: "now",
                },
                {
                  date: "Depuis septembre 2026",
                  action: "Recevoir les e-factures de vos fournisseurs",
                  detail: "Vos fournisseurs grandes entreprises (opérateur télécom, expert-comptable corporate...) vous envoient déjà des e-factures. Avec Deviso, vous les recevez et vous pouvez les ouvrir.",
                  status: "soon",
                },
                {
                  date: "Sans attendre",
                  action: "Choisir votre plateforme agréée",
                  detail: "Elle vous sert déjà à recevoir vos factures, et c'est par elle que vous émettrez les vôtres. Dans la plupart des cas, elle est intégrée à votre logiciel de facturation.",
                  status: "future",
                },
                {
                  date: "1er septembre 2027",
                  action: "Obligation universelle, passer en e-invoicing",
                  detail: "À partir de cette date, toutes vos factures B2B doivent transiter via une PDP. Une facture PDF envoyée par email n'est plus conforme à l'obligation.",
                  status: "deadline",
                },
              ].map(({ date, action, detail, status }) => (
                <div key={date} className={`rounded-xl border p-4 ${
                  status === "now" ? "border-emerald-500/30 bg-[#14211a]" :
                  status === "soon" ? "border-amber-500/30 bg-[#241d11]" :
                  status === "deadline" ? "border-red-500/20 bg-[#241717]" :
                  "border-ds-border bg-ds-surface"
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
            <h2 className="text-xl font-bold text-ink mb-4">Le seuil de franchise ne change pas avec la réforme</h2>
            <p>
              Autre point de confusion : certains pensent que la réforme modifie les seuils de franchise TVA. Non. Les seuils restent inchangés :
            </p>
            <div className="mt-4 bg-ds-surface border border-ds-border rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Prestation de services BIC :</span></div>
                <div className="text-ink font-semibold">37 500 € / an</div>
                <div><span className="text-gray-500">Activités libérales BNC :</span></div>
                <div className="text-ink font-semibold">37 500 € / an</div>
                <div><span className="text-gray-500">Commerce / hébergement :</span></div>
                <div className="text-ink font-semibold">85 000 € / an</div>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Si vous dépassez ces seuils, vous devenez assujetti à la TVA, mais c&apos;est une question fiscale distincte de la réforme de facturation électronique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-4">Questions fréquentes des micro-entrepreneurs</h2>
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
        <div className="mt-14 mb-10 bg-ds-surface border border-ds-border rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Guide réforme 2026, tous les articles</p>
          <div className="space-y-3">
            {[
              { href: "/blog/facturation-electronique-2026", title: "Guide complet réforme facturation électronique 2026" },
              { href: "/blog/choisir-plateforme-agreee-freelance", title: "Comment choisir sa plateforme agréée (PDP)" },
              { href: "/blog/e-reporting-freelance-2026", title: "E-reporting : l'obligation B2C dont personne ne parle" },
              { href: "/blog/checklist-reforme-facturation-2026", title: "Checklist réforme 2026 : êtes-vous prêt ?" },
            ].map(({ href, title }) => (
              <Link key={href} href={href} className="flex items-center gap-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors group">
                <span className="text-indigo-500 group-hover:text-indigo-300 shrink-0">→</span>
                {title}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#191830] border border-indigo-500/20 p-8 text-center mb-14">
          <h2 className="text-xl font-bold text-ink mb-3">Factur-X inclus dans Deviso</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-lg mx-auto">
            Toutes vos factures Deviso sont déjà au format Factur-X EN 16931, le format requis par la réforme. La mention de franchise en base de TVA est gérée automatiquement selon votre régime.
          </p>
          <WaitlistButton plan="free" label="Essayer Deviso 14 jours →" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-ink font-semibold px-6 py-3 rounded-xl transition-colors text-sm" />
          <Signature />
        </div>

              </main>
    </PageSite>
  );
}
