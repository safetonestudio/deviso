import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { TriangleAlert, CircleCheck, Info } from "lucide-react";

const SLUG = "facture-electronique-refusee-que-faire";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichées sur la page, et balisées en `FAQPage` à partir de cette
 * même liste.
 */
const FAQ = [
  {
    q: "Quelle est la différence entre une facture refusée et une facture rejetée ?",
    a: "Un refus (statut 210) vient de votre client : il refuse la facture dans son intégralité, pour un motif commercial ou comptable. Un rejet (statut 213) vient d'une plateforme — celle qui émet ou celle qui reçoit : ses contrôles fonctionnels ont détecté une anomalie sur la facture elle-même. Le premier se règle avec votre client, le second en corrigeant le document. Ce sont les deux seuls statuts d'échec, et ils sont tous deux obligatoires dans le cycle de vie.",
  },
  {
    q: "Peut-on corriger une facture refusée et la renvoyer ?",
    a: "Non, pas directement. Un refus est terminal : les spécifications de la DGFiP prévoient que le fournisseur procède à une annulation comptable, c'est-à-dire un avoir, puis émette une nouvelle facture corrigée. On ne modifie pas une facture déjà déposée — c'est tout l'intérêt de la numérotation continue et de l'archivage.",
  },
  {
    q: "Faut-il transmettre l'avoir qui annule une facture refusée ?",
    a: "Non, et c'est le point le plus contre-intuitif de tout le dispositif. Les spécifications externes de la DGFiP précisent que dans le cas des statuts « Refusée » ou « Rejetée », l'annulation comptable ne doit pas générer de flux de données réglementaires. L'administration sait déjà que la facture n'a pas abouti : elle a reçu le statut d'échec. Transmettre l'avoir créerait un doublon de données. L'avoir reste donc interne à votre comptabilité.",
  },
  {
    q: "Mon client peut-il refuser une facture pour n'importe quel motif ?",
    a: "Non. Le motif de refus est un code normé, et la liste des codes acceptés pour le statut « Refusée » est fermée. Sur la plateforme agréée à laquelle Deviso est adossé, treize codes seulement sont acceptés pour ce statut — et il n'y a pas de code « Autre ». Un refus doit donc entrer dans l'une de ces treize cases, ce qui est une protection : votre client ne peut pas refuser « parce que ».",
  },
  {
    q: "Que se passe-t-il si mon client demande seulement des justificatifs ?",
    a: "Ce n'est pas un refus. Le motif « Justificatif absent ou insuffisant » fait passer la facture au statut « Suspendue » (208) et non « Refusée ». Vous renvoyez alors un cycle de vie « Complétée » (209) avec les pièces manquantes, et le traitement reprend. La facture n'est pas annulée, et vous n'avez pas d'avoir à passer.",
  },
  {
    q: "Combien de statuts existe-t-il, et doit-on les connaître tous ?",
    a: "Non. La liste publiée par la DGFiP va de 200 à 213 et n'est explicitement pas exhaustive — elle renvoie, pour le reste, à une norme AFNOR payante. Mais quatre statuts seulement sont obligatoires pour une facture : Déposée (200), Refusée (210), Encaissée (212) et Rejetée (213). Les autres sont facultatifs, et toutes les plateformes ne les émettent pas.",
  },
];

/**
 * Les statuts du cycle de vie d'une facture, d'après le tableau 8 des
 * spécifications externes de la DGFiP. Les définitions sont celles du document,
 * reformulées pour un lecteur qui n'est pas comptable — mais sans en changer le
 * sens, et sans inventer les codes au-delà de 213, où la table s'arrête.
 */
const STATUTS = [
  { code: 200, libelle: "Déposée", obligatoire: true, quoi: "Votre plateforme a contrôlé la facture et la juge conforme. C'est le point de départ : à partir de là, la facture existe officiellement." },
  { code: 201, libelle: "Émise par la plateforme", obligatoire: false, quoi: "Votre plateforme l'a transmise à celle de votre client." },
  { code: 202, libelle: "Reçue par la plateforme", obligatoire: false, quoi: "La plateforme de votre client l'a reçue." },
  { code: 203, libelle: "Mise à disposition", obligatoire: false, quoi: "La plateforme de votre client la lui a mise à disposition. Elle est dans ses mains." },
  { code: 204, libelle: "Prise en charge", obligatoire: false, quoi: "Votre client accuse réception." },
  { code: 205, libelle: "Approuvée", obligatoire: false, quoi: "Votre client accepte la facture dans son intégralité." },
  { code: 206, libelle: "Approuvée partiellement", obligatoire: false, quoi: "Il n'accepte qu'une partie de la facture." },
  { code: 207, libelle: "En litige", obligatoire: false, quoi: "Il est en désaccord sur tout ou partie de la facture." },
  { code: 208, libelle: "Suspendue", obligatoire: false, quoi: "Il attend des pièces justificatives et met le traitement en pause. Ce n'est pas un refus." },
  { code: 209, libelle: "Complétée", obligatoire: false, quoi: "Vous avez fourni les pièces attendues. Le traitement reprend." },
  { code: 210, libelle: "Refusée", obligatoire: true, quoi: "Votre client refuse la facture dans son intégralité. Terminal : il faudra un avoir." },
  { code: 211, libelle: "Paiement transmis", obligatoire: false, quoi: "Votre client déclare avoir payé — ou vous, avoir remboursé." },
  { code: 212, libelle: "Encaissée", obligatoire: true, quoi: "Vous déclarez avoir perçu un paiement, partiel ou total. C'est une obligation au titre de l'article 290 A du CGI." },
  { code: 213, libelle: "Rejetée", obligatoire: true, quoi: "Une plateforme a détecté une anomalie sur la facture elle-même. Terminal aussi." },
];

/**
 * Les treize motifs acceptés pour un refus (statut 210) sur la plateforme
 * agréée utilisée par Deviso, avec ce qu'ils veulent dire en pratique. Les
 * libellés viennent du tableau des motifs de refus de l'annexe 7 des
 * spécifications DGFiP ; la colonne « ce que ça veut dire » est une explication,
 * pas une citation.
 */
const MOTIFS = [
  { code: "MONTANTTOTAL_ERR", libelle: "Montant total erroné", pratique: "Un total ne tombe pas juste — souvent le net à payer. Vérifiez d'abord vos arrondis ligne par ligne." },
  { code: "CALCUL_ERR", libelle: "Erreur de calcul de la facture", pratique: "Détectée au contrôle automatique ou après : une ligne, un arrondi non accepté. C'est un problème de chiffres, pas de fond." },
  { code: "TX_TVA_ERR", libelle: "Taux de TVA erroné", pratique: "Le taux appliqué n'est pas celui attendu. Fréquent dans le BTP, où 5,5 %, 10 % et 20 % coexistent selon la nature des travaux." },
  { code: "NON_CONFORME", libelle: "Mention légale manquante", pratique: "Une mention obligatoire est absente. Si vous êtes en franchise de TVA, c'est souvent la mention de l'article 293 B du CGI qui manque." },
  { code: "DOUBLON", libelle: "Facture en doublon", pratique: "Même numéro, même émetteur, même année. C'est le motif pour une facture reçue deux fois." },
  { code: "DOUBLE_FACT", libelle: "Données réglementaires F1 en doublon", pratique: "Attention, ce n'est PAS « double facturation ». Il s'agit du doublon des données transmises à l'administration, pas de la facture." },
  { code: "DEST_ERR", libelle: "Erreur de destinataire", pratique: "La facture est partie à la mauvaise entité. Arrive avec les groupes à plusieurs établissements." },
  { code: "ADR_ERR", libelle: "Adresse de facturation électronique erronée", pratique: "L'adresse électronique du destinataire est absente ou fausse. C'est un problème d'annuaire, pas de contenu." },
  { code: "TRANSAC_INC", libelle: "Transaction inconnue", pratique: "La facture ne correspond à aucune livraison ou prestation que le client identifie. À clarifier avant de refacturer." },
  { code: "EMMET_INC", libelle: "Émetteur inconnu", pratique: "Votre client ne vous identifie pas. C'est un garde-fou anti-spam : il faut se faire référencer chez lui." },
  { code: "CONTRAT_TERM", libelle: "Contrat terminé", pratique: "Plus de facturation possible sur ce contrat. Vérifiez la date de fin avant d'émettre." },
  { code: "CMD_ERR", libelle: "N° de commande incorrect ou manquant", pratique: "Numéro erroné, inexistant ou déjà facturé. Ne justifie un refus que si l'acheteur vous avait fourni ce numéro AVANT la facturation." },
  { code: "REF_CT_ABSENT", libelle: "Référence contractuelle manquante", pratique: "Une référence exigée par le contrat manque : numéro de contrat, de bon de livraison, référence acheteur ou projet." },
];

export default function Page() {
  const a = article(SLUG);
  const lectures = suggestionsDeLecture(SLUG);

  return (
    <div className="min-h-screen bg-ds-bg">
      <DonneesStructurees donnees={jsonLdArticle(SLUG, FAQ)} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ds-bg/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Deviso" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">D</span>
            </div>
            <span className="font-semibold text-lg text-white">Deviso</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/blog" className="text-white font-semibold">Blog</Link>
            <Link href="/conformite" className="text-gray-400 hover:text-white transition-colors">Conformité</Link>
            <Link href="/#tarifs" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Connexion</Link>
            <WaitlistButton
              plan="free"
              label="Essayer gratuitement"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
            />
          </div>
          <NavbarMobile />
        </div>
      </nav>

      <article className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-gray-400">Facture refusée ou rejetée</span>
          </nav>

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                Cycle de vie
              </span>
              <span className="text-xs text-gray-400">
                {new Date(a.misAJourLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {a.dureeLecture} min
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">{a.h1}</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Une facture électronique ne se contente pas de partir. Elle porte un statut, qui change au fil de
              son traitement, et deux de ces statuts sont des échecs. Ils n&apos;ont ni la même cause, ni le même
              remède — et dans un cas, la bonne réaction est exactement l&apos;inverse de l&apos;intuition.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {/* ── La réponse immédiate ── */}
            <section className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-2xl p-6">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                Si vous êtes pressé
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    <strong className="text-white">Rejetée (213)</strong> : une plateforme a trouvé une anomalie
                    sur le document. Corrigez la facture, émettez-en une nouvelle.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    <strong className="text-white">Refusée (210)</strong> : votre client refuse. Appelez-le avant
                    de toucher à quoi que ce soit — le motif vous dit quoi, pas pourquoi.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Dans les deux cas : <strong className="text-white">avoir d&apos;annulation, puis nouvelle
                    facture</strong>. Et cet avoir ne se transmet pas — voir pourquoi plus bas, c&apos;est le
                    point le moins intuitif du dispositif.
                  </span>
                </li>
              </ul>
            </section>

            {/* ── 1. Refusée vs rejetée ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Refusée, rejetée : deux mots, deux responsables
              </h2>
              <p className="mb-5">
                Les deux termes se ressemblent, et la presse les utilise indifféremment. Ils désignent pourtant
                des choses opposées, et confondre les deux fait perdre du temps au mauvais endroit : on appelle
                le client alors qu&apos;il s&apos;agit d&apos;un arrondi, ou on relit ses totaux alors que le
                client contestait la livraison.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-5">
                  <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-2">
                    Refusée · statut 210
                  </p>
                  <p className="text-white font-medium mb-2">Ça vient de votre client</p>
                  <p className="text-gray-400 mb-3">
                    Il refuse la facture dans son intégralité. La cause est commerciale ou comptable : un montant
                    qu&apos;il contexte, une prestation qu&apos;il ne reconnaît pas, une référence qui manque à
                    son process.
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-white">Ce que vous faites :</strong> vous lisez le motif, vous
                    comprenez, et vous parlez à votre client. Le motif est un code, pas une explication.
                  </p>
                </div>
                <div className="bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5">
                  <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                    Rejetée · statut 213
                  </p>
                  <p className="text-white font-medium mb-2">Ça vient d&apos;une plateforme</p>
                  <p className="text-gray-400 mb-3">
                    Celle qui émet ou celle qui reçoit. Ses contrôles fonctionnels ont détecté une anomalie sur
                    la facture elle-même : format, cohérence, données réglementaires, habilitations.
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-white">Ce que vous faites :</strong> vous corrigez le document. Votre
                    client n&apos;est pas en cause et, le plus souvent, ne l&apos;a même pas vue.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 bg-ds-surface border border-ds-border rounded-xl p-5 mt-4">
                <Info size={18} className="shrink-0 mt-0.5 text-indigo-400" />
                <p className="text-gray-400">
                  Ces deux statuts sont <strong className="text-white">obligatoires</strong> dans le cycle de vie
                  d&apos;une facture, avec « Déposée » (200) et « Encaissée » (212). Autrement dit, toute
                  plateforme agréée doit les émettre : vous serez informé d&apos;un échec, quelle que soit la
                  plateforme de votre client.
                </p>
              </div>
            </section>

            {/* ── 2. Les statuts ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Les statuts que vous verrez passer
              </h2>
              <p className="mb-5">
                Voici la liste publiée par la DGFiP. Deux remarques avant de la lire. D&apos;abord, elle{" "}
                <strong className="text-white">n&apos;est pas exhaustive</strong> : le document renvoie
                explicitement, pour la suite, à une norme AFNOR payante — donc un code au-delà de 213 existe
                peut-être, et personne d&apos;honnête ne peut vous dire ce qu&apos;il signifie. Ensuite, seuls
                quatre statuts sont obligatoires ; les autres sont facultatifs, et toutes les plateformes ne les
                émettent pas. Ne vous inquiétez pas de ne pas voir défiler les quatorze.
              </p>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[36rem]">
                  <thead>
                    <tr className="border-b border-ds-border">
                      <th className="py-3 pr-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Libellé</th>
                      <th className="py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ce que ça veut dire pour vous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATUTS.map((s) => (
                      <tr
                        key={s.code}
                        className={`border-b border-ds-border last:border-0 ${
                          s.code === 210 || s.code === 213 ? "bg-rose-950/10" : ""
                        }`}
                      >
                        <td className="py-3 pr-3 align-top tabular-nums text-gray-400">{s.code}</td>
                        <td className="py-3 pr-4 align-top">
                          <span className="text-white font-medium whitespace-nowrap">{s.libelle}</span>
                          {s.obligatoire && (
                            <span className="block text-[10px] font-semibold text-emerald-400 mt-0.5">
                              obligatoire
                            </span>
                          )}
                        </td>
                        <td className="py-3 align-top text-gray-400">{s.quoi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-gray-400">
                Le statut 208 « Suspendue » mérite une mention : ce n&apos;est <strong className="text-white">pas
                un refus</strong>. Quand votre client demande des pièces justificatives, la facture passe en
                suspens, vous renvoyez un cycle de vie « Complétée » (209) avec les pièces, et le traitement
                reprend là où il s&apos;était arrêté. Aucun avoir, aucune refacturation.
              </p>
            </section>

            {/* ── 3. Les motifs ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Les treize motifs de refus possibles
              </h2>
              <p className="mb-3">
                Un refus porte toujours un motif, et ce motif est un code normé — pas un texte libre. C&apos;est
                une bonne nouvelle pour vous : <strong className="text-white">la liste des codes acceptés pour un
                refus est fermée</strong>, et il n&apos;y a pas de code « Autre ». Votre client ne peut pas
                refuser « parce que ». Il doit ranger son refus dans l&apos;une de ces treize cases.
              </p>
              <p className="mb-5 text-gray-400">
                Le nombre exact peut varier d&apos;une plateforme à l&apos;autre — c&apos;est elle qui décide
                quels codes elle accepte pour un statut donné. Treize est le nombre sur la plateforme agréée à
                laquelle Deviso est adossé.
              </p>
              <div className="space-y-3">
                {MOTIFS.map((m) => (
                  <div key={m.code} className="bg-ds-surface border border-ds-border rounded-xl p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                      <code className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {m.code}
                      </code>
                      <span className="text-white font-medium">{m.libelle}</span>
                    </div>
                    <p className="text-gray-400">{m.pratique}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5 mt-4">
                <TriangleAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-semibold text-white mb-1">Le piège de DOUBLE_FACT</p>
                  <p className="text-gray-400">
                    Ce code ne veut <strong className="text-white">pas</strong> dire « double facturation ». Il
                    désigne le doublon des <em>données réglementaires</em> transmises à l&apos;administration. Si
                    vous avez réellement été facturé deux fois — ou si votre client le croit — le motif est{" "}
                    <code className="text-xs text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">DOUBLON</code>.
                    C&apos;est exactement le genre d&apos;erreur de lecture qui fait annuler une facture pour la
                    mauvaise raison, et Deviso l&apos;a faite avant de lire la table normative.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 4. L'avoir ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                L&apos;avoir : pourquoi il ne faut pas le transmettre
              </h2>
              <p className="mb-4">
                Un refus et un rejet sont tous deux <strong className="text-white">terminaux</strong>. On ne
                modifie pas une facture déjà déposée : la numérotation est continue, le document est archivé, et
                c&apos;est précisément ce qui fait sa valeur probante. La marche à suivre est donc toujours la
                même : un avoir qui annule la facture, puis une nouvelle facture corrigée.
              </p>
              <p className="mb-4">
                Et voilà le point que presque aucun contenu n&apos;explique. Les spécifications externes de la
                DGFiP sont explicites :
              </p>
              <blockquote className="border-l-2 border-indigo-500/50 pl-5 py-1 mb-4 text-gray-300 italic">
                « Dans les cas des statuts “Refusée” ou “Rejetée”, le fournisseur doit procéder à une annulation
                comptable (avoir interne). Cette opération ne doit pas générer de flux de données réglementaires
                au portail public de facturation. »
              </blockquote>
              <p className="mb-4">
                Autrement dit : <strong className="text-white">l&apos;avoir reste chez vous</strong>. Il existe
                dans votre comptabilité, il annule bien la facture, mais il ne part pas dans le circuit
                réglementaire.
              </p>
              <p className="mb-5">
                La logique est cohérente quand on y regarde : l&apos;administration a déjà reçu le statut
                d&apos;échec. Elle sait que cette facture n&apos;a pas abouti. Lui transmettre en plus un avoir
                reviendrait à déclarer deux fois la même annulation — un doublon de données, exactement ce que le
                dispositif cherche à éviter.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
                    Avoir interne — ne se transmet pas
                  </p>
                  <p className="text-gray-300">
                    Quand il annule une facture <strong className="text-white">refusée</strong> ou{" "}
                    <strong className="text-white">rejetée</strong>. Écriture comptable, point.
                  </p>
                </div>
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Avoir ordinaire — se transmet
                  </p>
                  <p className="text-gray-400">
                    Quand il annule une facture qui a, elle, <strong className="text-white">abouti</strong> :
                    remise accordée après coup, geste commercial, retour de marchandise. Là, l&apos;administration
                    n&apos;a aucune raison de le savoir autrement.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-gray-400">
                C&apos;est une distinction qu&apos;un logiciel doit faire à votre place, parce qu&apos;elle dépend
                du statut de la facture annulée et que personne ne devrait avoir à s&apos;en souvenir. Dans
                Deviso, elle est codée et couverte par un test automatisé — c&apos;est le genre de règle qui ne se
                voit pas quand elle est juste, et qui se paie quand elle est fausse.
              </p>
            </section>

            {/* ── 5. Quoi faire ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Quoi faire, dans l&apos;ordre</h2>
              <ol className="space-y-4">
                {[
                  {
                    titre: "Lisez le statut avant le motif",
                    detail:
                      "Rejetée ou refusée ? Ça détermine à qui vous parlez. Un rejet se règle seul, un refus se règle à deux.",
                  },
                  {
                    titre: "Ne refacturez pas tout de suite",
                    detail:
                      "Le motif dit ce qui est reproché, pas pourquoi. Un « montant total erroné » peut être un arrondi de votre côté comme un désaccord sur le périmètre. Un appel de trois minutes évite un deuxième refus.",
                  },
                  {
                    titre: "Passez l'avoir d'annulation",
                    detail:
                      "Interne, non transmis. Il annule la facture dans votre comptabilité et dans votre numérotation.",
                  },
                  {
                    titre: "Corrigez, puis émettez une nouvelle facture",
                    detail:
                      "Nouveau numéro, à la suite. Ne réutilisez jamais le numéro de la facture annulée : la continuité de la numérotation est une obligation (article 242 nonies A du CGI).",
                  },
                  {
                    titre: "Notez le motif quelque part",
                    detail:
                      "Si le même motif revient avec le même client, ce n'est plus un incident, c'est un réglage à faire : une référence à ajouter systématiquement, un taux à revoir, un interlocuteur à changer.",
                  },
                ].map((e, i) => (
                  <li key={e.titre} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium mb-1">{e.titre}</p>
                      <p className="text-gray-400">{e.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── 6. Éviter ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Les trois causes de refus les plus évitables
              </h2>
              <div className="space-y-3">
                {[
                  {
                    titre: "La référence que le client exige et que vous ne mettez pas",
                    detail:
                      "Numéro de commande, référence de contrat, code de projet. Beaucoup de refus n'ont rien à voir avec votre travail : votre facture n'entre pas dans le process comptable du client. Demandez une fois quelles références sont obligatoires, et mettez-les à chaque fois.",
                  },
                  {
                    titre: "La mention légale manquante en franchise de TVA",
                    detail:
                      "Si vous êtes en franchise en base, la mention « TVA non applicable, art. 293 B du CGI » doit figurer sur la facture. Et surtout : ne créez pas une ligne de TVA à 0 %, c'est l'erreur classique. Ce n'est pas la même chose qu'une exonération, et un contrôle automatique peut la rejeter.",
                  },
                  {
                    titre: "L'arrondi qui ne tombe pas juste",
                    detail:
                      "Une facture dont les lignes ne s'additionnent pas exactement au total est refusable, et c'est d'autant plus rageant que ça ne vient jamais de vous mais de l'outil. Vérifiez une fois, sur une vraie facture, que vos lignes arrondies font bien le total affiché.",
                  },
                ].map((e) => (
                  <div key={e.titre} className="flex gap-4 bg-ds-surface border border-ds-border rounded-xl p-5">
                    <CircleCheck size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                    <div>
                      <p className="text-white font-medium mb-1">{e.titre}</p>
                      <p className="text-gray-400">{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FAQ ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Questions fréquentes</h2>
              <div className="space-y-4">
                {FAQ.map(({ q, a: reponse }) => (
                  <div key={q} className="bg-ds-surface rounded-xl border border-ds-border p-6">
                    <h3 className="text-white font-medium mb-3">{q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{reponse}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Sources ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Sources</h2>
              <p className="text-gray-400 mb-3">
                Tout ce qui est écrit ici vient du <strong className="text-white">dossier de spécifications
                externes de la facturation électronique, version 3.2</strong>, publié par la DGFiP le 30 avril
                2026 :
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>
                  le dossier général, pour le tableau des statuts du cycle de vie et la règle de
                  l&apos;avoir interne ;
                </li>
                <li>
                  l&apos;annexe 2 (format sémantique du cycle de vie), pour les statuts obligatoires et le champ
                  de code motif ;
                </li>
                <li>l&apos;annexe 7 (règles de gestion), pour le tableau des motifs de refus.</li>
              </ul>
              <p className="text-gray-400 mt-3">
                Le paquet se télécharge sur{" "}
                <a
                  href="https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  impots.gouv.fr
                </a>
                . La liste des statuts au-delà de 213 relève de la norme AFNOR XP Z12-012, qui est payante :
                c&apos;est pour ça que vous ne trouverez nulle part de traduction fiable de ces codes, y compris
                ici.
              </p>
            </section>

            {/* ── À lire ensuite ── */}
            {lectures.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-6">À lire ensuite</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {lectures.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="group bg-ds-surface border border-ds-border rounded-xl p-5 hover:border-indigo-500/40 transition-all"
                    >
                      <p className="text-white font-medium text-sm leading-snug mb-2 group-hover:text-indigo-200 transition-colors">
                        {l.titre}
                      </p>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{l.resume}</p>
                      <p className="text-gray-600 text-xs">{l.dureeLecture} min de lecture</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <Signature />
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
