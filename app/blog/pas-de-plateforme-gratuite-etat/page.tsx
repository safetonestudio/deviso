import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { CircleCheck, ExternalLink, TriangleAlert } from "lucide-react";

const SLUG = "pas-de-plateforme-gratuite-etat";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichees sur la page, et balisees en FAQPage a partir de cette
 * meme liste. Apostrophes typographiques directes, jamais d'entite HTML ici.
 */
const FAQ = [
  {
    q: "L'État ne fournit donc aucune plateforme gratuite ?",
    a: "Non, plus aujourd'hui. Un portail public gratuit était prévu pour émettre et recevoir vos factures : sa fonction d'échange a été abandonnée en 2024 et son développement arrêté ensuite. Pour émettre et recevoir, vous passez désormais par un opérateur privé immatriculé, appelé plateforme agréée.",
  },
  {
    q: "Le portail public a-t-il complètement disparu ?",
    a: "Non. Le PPF subsiste, mais dans un autre rôle : celui d'annuaire central des destinataires et de concentrateur des données transmises à l'administration. Ce n'est plus un canal par lequel vous faites transiter vos factures, c'est une pièce d'infrastructure côté État.",
  },
  {
    q: "Puis-je au moins recevoir mes factures gratuitement ?",
    a: "Souvent oui. La réception coûte peu à opérer, et beaucoup d'éditeurs la proposent sans frais. C'est déjà ce qui est obligatoire pour tout le monde depuis le 1er septembre 2026, avant même l'obligation d'émettre.",
  },
  {
    q: "Existe-t-il une offre d'émission gratuite ?",
    a: "Chez certains éditeurs privés, oui, généralement plafonnée en nombre de factures ou limitée en fonctionnalités. Pour une très petite activité, cela peut suffire. Ce qui n'existe pas, c'est une plateforme publique, illimitée et gratuite : la gratuité vient d'acteurs privés, avec leurs conditions. Vérifiez toujours que l'offre est agréée ou adossée à une plateforme agréée.",
  },
  {
    q: "Pourquoi l'État a-t-il renoncé au portail gratuit ?",
    a: "Faire tourner une plateforme d'échange à l'échelle du pays est complexe et coûteux, alors qu'un écosystème d'opérateurs privés pouvait assurer ce rôle. L'État a préféré se recentrer sur l'annuaire et la collecte des données, et laisser l'émission et la réception aux plateformes agréées.",
  },
];

export default function Page() {
  const a = article(SLUG);
  const lectures = suggestionsDeLecture(SLUG);

  return (
    <div className="min-h-screen bg-site">
      <DonneesStructurees donnees={jsonLdArticle(SLUG, FAQ)} />

      {/* Navbar */}
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
            <span className="text-gray-400">Pas de plateforme gratuite de l&apos;État</span>
          </nav>

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Réforme 2026
              </span>
              <span className="text-xs text-gray-400">
                {new Date(a.misAJourLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {a.dureeLecture} min
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">{a.h1}</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Vous cherchez la plateforme gratuite que l&apos;État devait fournir pour vos factures. C&apos;est
              une recherche légitime : cette plateforme a existé, sur le papier. Elle n&apos;existe plus. Voici
              son histoire, ce qu&apos;il en reste, et comment vous mettre en règle sans payer trop cher.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {/* La reponse tout de suite */}
            <section className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-2xl p-6">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                La réponse en trois lignes
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    L&apos;État avait bien prévu un <strong className="text-white">portail public gratuit</strong>,
                    le PPF, pour émettre et recevoir les factures électroniques.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Cette fonction gratuite a été <strong className="text-white">abandonnée en 2024</strong>, puis
                    le développement du portail arrêté. L&apos;État s&apos;est retiré du rôle d&apos;opérateur.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Résultat : tout le monde passe par un <strong className="text-white">opérateur privé
                    agréé</strong>. Il n&apos;y a pas d&apos;option publique gratuite, mais il y a des options
                    peu coûteuses, et la réception est souvent gratuite.
                  </span>
                </li>
              </ul>
            </section>

            {/* 1. Ce que le portail devait etre */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce que le portail public devait être
              </h2>
              <p className="mb-4">
                Au cœur du projet initial de la réforme, il y avait le <strong className="text-white">Portail
                Public de Facturation</strong>, le PPF. L&apos;idée était simple et généreuse : une plateforme
                gérée par l&apos;État, gratuite, par laquelle chaque entreprise aurait pu émettre et recevoir ses
                factures électroniques sans passer par un prestataire. Une sorte de service public de la facture,
                accessible à tous, du grand groupe au micro-entrepreneur.
              </p>
              <p>
                C&apos;est cette promesse que beaucoup ont retenue, et c&apos;est elle qui fait qu&apos;on cherche
                encore aujourd&apos;hui « la plateforme gratuite de l&apos;État ». La recherche n&apos;est pas
                absurde : elle porte sur quelque chose qui a réellement été annoncé.
              </p>
            </section>

            {/* 2. Ce qu'il est devenu */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce qu&apos;il est devenu, et pourquoi
              </h2>
              <p className="mb-4">
                En <strong className="text-white">octobre 2024</strong>, l&apos;administration annonce un
                changement de cap : le PPF n&apos;assurera plus les fonctions d&apos;émission et de réception des
                factures. L&apos;État se retire du rôle d&apos;opérateur d&apos;échange. Le développement de cette
                partie du portail est arrêté par la suite.
              </p>
              <p className="mb-4">
                Le PPF ne disparaît pas pour autant. Il subsiste, mais dans un rôle différent :
                <strong className="text-white"> annuaire central</strong> des destinataires, celui qui permet de
                savoir vers quelle plateforme envoyer une facture, et
                <strong className="text-white"> concentrateur des données</strong> transmises à
                l&apos;administration fiscale. Autrement dit, il reste une pièce d&apos;infrastructure côté État,
                mais il n&apos;est plus le tuyau par lequel vos factures circulent.
              </p>
              <p>
                La raison tient en une phrase : faire tourner une plateforme d&apos;échange à l&apos;échelle du
                pays est lourd et coûteux, alors qu&apos;un écosystème d&apos;opérateurs privés pouvait déjà le
                faire. L&apos;État a choisi de se concentrer sur l&apos;annuaire et la collecte, et de laisser
                l&apos;émission et la réception aux plateformes agréées.
              </p>
            </section>

            {/* 3. Ce que ca change */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce que ça change concrètement pour vous
              </h2>
              <p className="mb-4">
                Puisqu&apos;il n&apos;y a plus de canal public d&apos;échange, toute entreprise assujettie doit
                passer par un <strong className="text-white">opérateur privé immatriculé</strong>, une plateforme
                agréée, pour émettre et recevoir ses factures. Ce n&apos;est plus une option parmi d&apos;autres,
                c&apos;est le seul chemin.
              </p>
              <div className="flex gap-3 bg-ds-surface border border-ds-border rounded-xl p-5">
                <CircleCheck size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                <p className="text-gray-300">
                  La bonne nouvelle : « passer par un opérateur privé » ne veut pas dire « payer cher ». La
                  réception est très souvent gratuite, et pour une petite activité, l&apos;émission peut
                  l&apos;être aussi. Le mot « obligatoire » a été beaucoup utilisé pour vendre de la peur ; la
                  réalité des coûts est plus douce.
                </p>
              </div>
            </section>

            {/* 4. Ce qui existe gratuitement */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce qui existe gratuitement, malgré tout
              </h2>
              <p className="mb-4">
                La gratuité n&apos;a pas disparu, elle a simplement changé de main : elle vient désormais
                d&apos;éditeurs privés, pas de l&apos;État. Concrètement :
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-white">La réception est souvent gratuite.</strong> Elle coûte peu à
                    opérer, et de nombreux éditeurs la proposent sans frais. C&apos;est déjà ce qui vous est
                    demandé depuis le 1<sup>er</sup> septembre 2026, avant même l&apos;obligation d&apos;émettre.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-white">Plusieurs plateformes ont une offre d&apos;émission
                    gratuite</strong>, généralement plafonnée en nombre de factures ou limitée en
                    fonctionnalités. Pour une très petite activité, cela peut réellement suffire.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-500 shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-white">Ce qui n&apos;existe pas</strong> : une plateforme officielle,
                    publique, illimitée et gratuite. Toute offre gratuite est celle d&apos;un acteur privé, avec
                    ses conditions, et il faut la lire comme telle.
                  </span>
                </li>
              </ul>
            </section>

            {/* 5. Ne pas trop payer */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Comment ne pas payer trop cher
              </h2>
              <ol className="space-y-4">
                {[
                  {
                    t: "Séparez la réception de l'émission",
                    d: "Vous pouvez très bien recevoir gratuitement chez un éditeur et n'ajouter l'émission que le jour où elle devient obligatoire pour vous, en 2027.",
                  },
                  {
                    t: "Comparez sur votre volume réel",
                    d: "Le bon critère n'est pas le prix de l'abonnement, c'est le coût pour le nombre de factures que vous émettez vraiment. Cinq factures par mois et cinquante ne conduisent pas au même choix.",
                  },
                  {
                    t: "Vérifiez l'agrément avant le prix",
                    d: "Une offre gratuite qui ne serait ni agréée ni adossée à une plateforme agréée ne vaut rien : elle ne pourra pas transmettre vos factures. Le contrôle est public et prend deux minutes.",
                  },
                ].map((item, i) => (
                  <li key={item.t} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium mb-1">{item.t}</p>
                      <p className="text-gray-400">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5">
                Sur ce dernier point, la distinction entre une plateforme agréée et une simple solution compatible
                mérite deux minutes de lecture, parce que c&apos;est elle qui décide de ce qu&apos;un outil a le
                droit de faire.{" "}
                <Link href="/blog/plateforme-agreee-ou-solution-compatible" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Plateforme agréée ou solution compatible : la différence
                </Link>
                .
              </p>
            </section>

            {/* 6. Attention aux pages qui vendent la peur */}
            <section>
              <div className="flex gap-3 bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5">
                <TriangleAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-semibold text-white mb-1">
                    Méfiez-vous des pages qui vendent la peur
                  </p>
                  <p className="text-gray-400">
                    Une partie du web qui traite ce sujet est financée par l&apos;affiliation : ces pages ont
                    intérêt à vous faire croire que la seule issue est un abonnement payant. La réforme est une
                    obligation réelle, mais elle n&apos;impose ni un tarif, ni un éditeur en particulier. Comparez
                    calmement, et allez vérifier l&apos;agrément à la source.
                  </p>
                </div>
              </div>
            </section>

            {/* Et Deviso */}
            <section className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Et nous, pour être clair
              </p>
              <p className="mb-4">
                Deviso est une <strong className="text-white">solution compatible</strong>, adossée à la
                plateforme agréée <strong className="text-white">Super PDP</strong>. Nous ne prétendons pas être
                l&apos;option gratuite de l&apos;État, elle n&apos;existe pas. Notre statut exact, avec le lien
                vers la liste officielle pour que vous vérifiiez vous-même, est sur notre page de conformité.
              </p>
              <Link
                href="/conformite"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <CircleCheck size={16} className="shrink-0" />
                Notre statut, en détail
              </Link>
            </section>

            {/* FAQ */}
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

            {/* Sources */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Sources</h2>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="https://www.economie.gouv.fr/actualites/facturation-electronique-entre-entreprises-coup-denvoi-de-la-reforme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    economie.gouv.fr, Coup d&apos;envoi de la réforme
                  </a>{" "}
                  (calendrier et principes)
                </li>
                <li>
                  <a
                    href="https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    impots.gouv.fr, Facturation électronique et plateformes agréées
                  </a>{" "}
                  (rôle du PPF et des plateformes agréées)
                </li>
                <li>
                  <a
                    href="https://kpmg.com/av/fr/avocats/eclairages/2024/10/facturation-electronique-le-schema-initialement-prevu-est-modifie.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                  >
                    KPMG Avocats, Le schéma initialement prévu est modifié (octobre 2024)
                    <ExternalLink size={13} className="shrink-0" />
                  </a>{" "}
                  (retrait du PPF des fonctions d&apos;émission et de réception)
                </li>
              </ul>
            </section>

            {/* A lire ensuite */}
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
