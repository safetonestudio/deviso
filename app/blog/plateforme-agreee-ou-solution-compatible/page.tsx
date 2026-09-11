import Link from "next/link";
import { NavbarMobile } from "@/components/NavbarMobile";
import { WaitlistButton } from "@/components/landing/WaitlistButton";
import { SiteFooter } from "@/components/SiteFooter";
import { Signature } from "@/components/blog/Signature";
import { DonneesStructurees } from "@/components/DonneesStructurees";
import { jsonLdArticle, metadonneesArticle, suggestionsDeLecture } from "@/lib/blog/meta";
import { article } from "@/lib/blog/registre";
import { CircleCheck, ExternalLink, TriangleAlert } from "lucide-react";

const SLUG = "plateforme-agreee-ou-solution-compatible";

export const metadata = metadonneesArticle(SLUG);

/**
 * Les questions affichées sur la page, et balisées en `FAQPage` à partir de cette
 * même liste.
 */
const FAQ = [
  {
    q: "Mon logiciel de facturation doit-il être une plateforme agréée ?",
    a: "Non. Il doit soit être agréé lui-même, soit être adossé à une plateforme agréée. Ce sont les deux seules configurations valables. Ce qui n'existe pas, c'est un logiciel qui transmettrait vos factures sans passer par une plateforme agréée : une solution non immatriculée n'y est pas autorisée.",
  },
  {
    q: "Comment savoir si mon éditeur est agréé ou simplement compatible ?",
    a: "Demandez-le, et vérifiez. La liste des plateformes agréées est publiée par la DGFiP sur impots.gouv.fr et téléchargeable. Si votre éditeur ne figure pas dessus, il est au mieux une solution compatible — ce qui est parfaitement valable, à condition qu'il puisse nommer la plateforme agréée à laquelle il est adossé.",
  },
  {
    q: "Est-ce moins bien d'utiliser une solution compatible ?",
    a: "Pas en soi. Ce qui compte, c'est que la chaîne soit complète et que vous puissiez la vérifier. Beaucoup d'éditeurs de logiciels de facturation, y compris parmi les plus utilisés par les indépendants, sont des solutions compatibles adossées à une plateforme agréée. Le vrai critère n'est pas le statut de l'éditeur, c'est sa capacité à vous dire lequel il a.",
  },
  {
    q: "Que signifie « immatriculation sous réserve » sur la liste officielle ?",
    a: "La DGFiP publie deux listes distinctes. La première réunit les opérateurs qui satisfont à l'ensemble des conditions, tests d'interopérabilité inclus : leur immatriculation est définitive. La seconde réunit ceux qui ont déposé un dossier complet et conforme, mais dont l'immatriculation définitive reste conditionnée à la réussite de ces tests. Une plateforme de la seconde liste est bien sur la liste officielle, mais son agrément n'est pas encore définitif.",
  },
  {
    q: "Combien de temps dure une immatriculation ?",
    a: "Trois ans, renouvelable. Ce n'est donc pas un statut acquis une fois pour toutes : une plateforme agréée aujourd'hui devra renouveler son immatriculation. C'est une raison de plus pour consulter la liste officielle à la source plutôt qu'un chiffre recopié sur un comparatif.",
  },
];

/** Ce que chacune des deux catégories peut faire, d'après les définitions officielles. */
const CAPACITES = [
  { quoi: "Émettre et transmettre vos factures électroniques", pa: true, sc: false },
  { quoi: "Recevoir des factures pour votre compte", pa: true, sc: false },
  { quoi: "Transmettre les données de facture, de transaction et de paiement à l'administration", pa: true, sc: false },
  { quoi: "Créer, mettre en forme et archiver vos factures", pa: true, sc: true },
  { quoi: "Générer un fichier au format Factur-X, UBL ou CII", pa: true, sc: true },
  { quoi: "Être immatriculé par l'administration fiscale", pa: true, sc: false },
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
            <span className="text-gray-400">Plateforme agréée ou solution compatible ?</span>
          </nav>

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Plateforme agréée
              </span>
              <span className="text-xs text-gray-400">
                {new Date(a.misAJourLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}
                {a.dureeLecture} min
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-4">{a.h1}</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Vous comparez deux logiciels de facturation. L&apos;un affiche « plateforme agréée », l&apos;autre
              « conforme à la réforme 2026 ». Ce n&apos;est pas une nuance de vocabulaire commercial : les deux
              n&apos;ont pas les mêmes droits, et la distinction est écrite noir sur blanc par l&apos;administration
              fiscale.
            </p>
          </div>

          <div className="space-y-10 text-sm text-gray-300 leading-relaxed">

            {/* ── La réponse tout de suite ── */}
            <section className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-2xl p-6">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                La réponse en trois lignes
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Une <strong className="text-white">plateforme agréée</strong> est immatriculée par
                    l&apos;administration fiscale. Elle peut transmettre vos factures, en recevoir pour votre
                    compte, et transmettre les données à l&apos;administration.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Une <strong className="text-white">solution compatible</strong> ne peut faire aucune de ces
                    trois choses. Elle doit s&apos;adosser à une plateforme agréée.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>
                    Donc la question à poser à votre éditeur n&apos;est pas « êtes-vous conforme ? » — tout le
                    monde répond oui. C&apos;est{" "}
                    <strong className="text-white">« êtes-vous agréé, ou adossé à qui ? »</strong>
                  </span>
                </li>
              </ul>
            </section>

            {/* ── 1. Les définitions officielles ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Les définitions officielles, et pourquoi elles sont contraignantes
              </h2>
              <p className="mb-4">
                L&apos;administration fiscale définit la plateforme agréée comme{" "}
                <em>un opérateur de dématérialisation qui a fait l&apos;objet d&apos;une procédure
                d&apos;immatriculation par l&apos;administration, pour une durée de trois ans renouvelable</em>.
                C&apos;est une immatriculation, pas un label qu&apos;on s&apos;attribue.
              </p>
              <p className="mb-4">
                Et elle est explicite sur la conséquence, pour un opérateur qui ne l&apos;a pas :{" "}
                <em>à défaut d&apos;immatriculation par l&apos;administration fiscale, cet opérateur n&apos;aura
                pas la qualité de plateforme agréée et ne sera donc pas autorisé à transmettre les factures
                électroniques aux plateformes des clients.</em>
              </p>
              <p className="mb-6">
                Autrement dit, ce n&apos;est pas une hiérarchie de qualité. C&apos;est une question
                d&apos;autorisation : ce qu&apos;une solution compatible ne peut pas faire, elle ne peut pas le
                faire du tout.
              </p>

              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[34rem]">
                  <thead>
                    <tr className="border-b border-ds-border">
                      <th className="py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Peut…
                      </th>
                      <th className="py-3 px-3 text-xs font-semibold text-emerald-300 uppercase tracking-wider whitespace-nowrap">
                        Plateforme agréée
                      </th>
                      <th className="py-3 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Solution compatible
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAPACITES.map((c) => (
                      <tr key={c.quoi} className="border-b border-ds-border last:border-0">
                        <td className="py-3 pr-4 text-gray-300">{c.quoi}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={c.pa ? "text-emerald-400" : "text-gray-600"}>{c.pa ? "oui" : "non"}</span>
                        </td>
                        <td className="py-3 pl-3 text-center">
                          <span className={c.sc ? "text-emerald-400" : "text-gray-600"}>{c.sc ? "oui" : "non"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 2. Ce que ça change vraiment ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Ce que ça change pour vous, et ce que ça ne change pas
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Ce que ça ne change pas
                  </p>
                  <p className="text-gray-400">
                    Votre usage quotidien. Que votre logiciel soit agréé ou adossé à une plateforme qui
                    l&apos;est, vous créez vos factures de la même façon et la transmission se fait en
                    arrière-plan. Une solution compatible adossée à une bonne plateforme agréée n&apos;est pas
                    moins conforme qu&apos;une plateforme agréée.
                  </p>
                </div>
                <div className="bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5">
                  <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-3">
                    Ce que ça change
                  </p>
                  <p className="text-gray-300">
                    Votre capacité à vérifier. Si votre éditeur est agréé, vous le trouvez sur la liste
                    officielle. S&apos;il est une solution compatible, il doit pouvoir nommer sa plateforme
                    agréée — et vous vérifiez celle-là. Un éditeur qui ne répond ni à l&apos;une ni à
                    l&apos;autre de ces questions est le seul cas réellement problématique.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 3. Vérifier ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Comment vérifier, en deux minutes</h2>
              <p className="mb-4">
                La liste est publique. Et elle est <strong className="text-white">double</strong>, ce qui est la
                subtilité que presque aucun comparatif ne mentionne :
              </p>
              <div className="space-y-3 mb-5">
                <div className="bg-ds-surface border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-white font-medium mb-1">Immatriculation définitive</p>
                  <p className="text-gray-400">
                    La liste des opérateurs <em>satisfaisant à l&apos;ensemble des conditions, incluant les tests
                    d&apos;interopérabilité</em>. Dossier complet <strong className="text-white">et</strong> tests
                    réussis.
                  </p>
                </div>
                <div className="bg-ds-surface border border-ds-border rounded-xl p-5">
                  <p className="text-white font-medium mb-1">Immatriculation sous réserve</p>
                  <p className="text-gray-400">
                    La liste des opérateurs <em>ayant déposé un dossier complet et conforme et en attente de leur
                    immatriculation définitive conditionnée à la réussite des tests d&apos;interopérabilité</em>.
                    Ils sont bien sur la liste officielle, mais leur agrément n&apos;est pas encore définitif.
                  </p>
                </div>
              </div>
              <div className="bg-indigo-500/[0.07] border border-indigo-500/30 rounded-xl p-5">
                <a
                  href="https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 font-medium transition-colors"
                >
                  Les deux listes officielles, sur impots.gouv.fr
                  <ExternalLink size={14} className="shrink-0" />
                </a>
                <p className="text-gray-400 text-xs mt-2">
                  Les fichiers sont téléchargeables en ODS, XLSX et PDF. C&apos;est la seule source qui fasse foi,
                  et elle est mise à jour régulièrement.
                </p>
              </div>
            </section>

            {/* ── 4. L'avertissement sur les comparateurs ── */}
            <section>
              <div className="flex gap-3 bg-amber-500/[0.06] border border-amber-500/25 rounded-xl p-5">
                <TriangleAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-semibold text-white mb-1">
                    Pourquoi ne pas se fier aux comparateurs sur ce point précis
                  </p>
                  <p className="text-gray-400">
                    Une vingtaine de sites se sont créés autour de cette réforme, la plupart financés par
                    l&apos;affiliation. Ils sont parfois utiles pour dégrossir, mais leurs chiffres se
                    contredisent : le nombre de plateformes agréées y est annoncé entre 137 et 166 selon les
                    pages, et certains attribuent à la même plateforme un statut définitif sur un site et « sous
                    réserve » sur un autre. Ils ne peuvent pas tous avoir raison. Pour une question de
                    conformité, allez à la source — c&apos;est deux minutes.
                  </p>
                </div>
              </div>
            </section>

            {/* ── 5. Les trois questions ── */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Les trois questions à poser à votre éditeur
              </h2>
              <p className="mb-5">
                Dans cet ordre. La troisième est celle qui compte, et c&apos;est celle qu&apos;on oublie de poser.
              </p>
              <ol className="space-y-4">
                {[
                  {
                    q: "Êtes-vous une plateforme agréée, ou une solution compatible ?",
                    pourquoi:
                      "Une réponse évasive à cette question est une réponse. « Nous sommes conformes » n'en est pas une.",
                  },
                  {
                    q: "Si vous êtes une solution compatible, à quelle plateforme agréée êtes-vous adossé ?",
                    pourquoi:
                      "Le nom, pas une formule. Sans nom, il n'y a rien à vérifier — et donc rien à croire.",
                  },
                  {
                    q: "Cette plateforme figure-t-elle sur la liste de la DGFiP, et sur laquelle des deux ?",
                    pourquoi:
                      "Vous pouvez répondre vous-même, en téléchargeant la liste. C'est le seul contrôle qui ne dépende de personne.",
                  },
                ].map((item, i) => (
                  <li key={item.q} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium mb-1">{item.q}</p>
                      <p className="text-gray-400">{item.pourquoi}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── 6. Et Deviso ── */}
            <section className="bg-ds-surface border border-ds-border rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Et nous, pour être clair
              </p>
              <p className="mb-4">
                Appliquons-nous les trois questions. <strong className="text-white">Deviso est une solution
                compatible</strong>, adossée à <strong className="text-white">Super PDP</strong>, qui est la
                plateforme agréée. Nous ne transmettons rien directement à l&apos;administration : c&apos;est
                Super PDP qui dépose vos factures et transmet les données.
              </p>
              <p className="mb-4">
                Nous l&apos;écrivons parce que c&apos;est la question qu&apos;on nous posera de toute façon, et
                parce qu&apos;un éditeur qui ne répond pas mérite qu&apos;on se méfie. Le détail, avec le lien
                vers la liste officielle pour que vous vérifiiez nous aussi, est sur notre page de conformité.
              </p>
              <Link
                href="/conformite"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <CircleCheck size={16} className="shrink-0" />
                Notre statut, en détail
              </Link>
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
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    impots.gouv.fr — Facturation électronique et plateformes agréées
                  </a>{" "}
                  (définitions de la plateforme agréée et de la solution compatible, durée de trois ans)
                </li>
                <li>
                  <a
                    href="https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    impots.gouv.fr — Je consulte la liste des plateformes agréées
                  </a>{" "}
                  (les deux listes, définitive et sous réserve)
                </li>
              </ul>
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
