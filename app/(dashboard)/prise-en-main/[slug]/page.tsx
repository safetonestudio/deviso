import { notFound } from "next/navigation";
import { MarkAsRead } from "./MarkAsRead";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  TriangleAlert,
  Info,
  Package,
  Timer,
  Tag,
  PenLine,
  Euro,
  Ruler,
  Scale,
  Landmark,
  Link2,
  CircleCheck,
  Crown,
  User,
  ClipboardList,
  BarChart3,
  Calendar,
  type LucideIcon,
} from "lucide-react";

// ── Helper UI ─────────────────────────────────────────────────────

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl my-4">
      <Lightbulb size={18} className="shrink-0 mt-0.5 text-indigo-400" />
      <div className="text-sm text-indigo-200 leading-relaxed">{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl my-4">
      <TriangleAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
      <div className="text-sm text-amber-200 leading-relaxed">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-ds-elevated border border-ds-border rounded-xl my-4">
      <Info size={18} className="shrink-0 mt-0.5 text-gray-400" />
      <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-2 [&>div:last-child>div:first-child>div:last-child]:opacity-0">
      {children}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {n}
        </div>
        <div className="w-px bg-ds-border flex-1 mt-2" />
      </div>
      <div className="pb-7 flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-2">{title}</p>
        <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-none space-y-1.5 text-sm text-gray-400">
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 leading-relaxed">
      <span className="text-indigo-500 mt-0.5 shrink-0">–</span>
      <span>{children}</span>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-ds-border uppercase tracking-wide">
        {title}
      </h2>
      <div className="space-y-4 text-sm text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-white font-medium">{children}</span>;
}

function Card({ icon: Icon, title, desc, accent = false }: { icon: LucideIcon; title: string; desc: string; accent?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${accent ? "bg-violet-500/5 border-violet-500/20" : "bg-ds-surface border-ds-border"}`}>
      <p className="text-sm font-medium text-white mb-1 flex items-center gap-2">
        <Icon size={17} className={accent ? "shrink-0 text-violet-400" : "shrink-0 text-indigo-400"} />
        {title}
      </p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Articles ──────────────────────────────────────────────────────

interface Article {
  title: string;
  description: string;
  readingTime: number;
  cta?: { label: string; href: string };
  content: React.ReactNode;
}

const ARTICLES: Record<string, Article> = {

  // ── 1. Premier devis ──────────────────────────────────────────
  "premier-devis": {
    title: "Créer son premier devis en 3 minutes",
    description: "Les étapes essentielles pour produire un devis professionnel rapidement, et les bons réflexes à adopter dès le départ.",
    readingTime: 4,
    cta: { label: "Créer un devis", href: "/proposals/new" },
    content: (
      <>
        <Section title="Les étapes">
          <Steps>
            <Step n={1} title="Devis → Nouveau devis">
              <p>
                Clique sur <B>Devis</B> dans le menu, puis sur <B>Nouveau devis</B>{" "}
                en haut à droite. Tu arrives directement dans l&apos;éditeur.
              </p>
            </Step>
            <Step n={2} title="Renseigne les infos client">
              <p>
                Saisis le nom de ton client (ou son entreprise), son email et son adresse.
                Ces informations apparaîtront sur le PDF final.
              </p>
              <Tip>
                <B>Bonne pratique :</B> renseigne l&apos;adresse complète dès maintenant -
                elle sera reprise automatiquement sur toutes tes prochaines factures pour ce client.
              </Tip>
            </Step>
            <Step n={3} title="Donne un objet précis">
              <p>
                L&apos;objet est la première chose que lit ton client. Sois précis :{" "}
                <em>« Refonte site vitrine, Agence Martin »</em> vaut bien mieux que{" "}
                <em>« Devis web »</em>.
              </p>
            </Step>
            <Step n={4} title="Ajoute tes lignes de prestation">
              <p>
                Clique sur <B>+ Ajouter une ligne</B> pour chaque prestation. Pour chaque ligne :
                description, quantité, unité et prix unitaire HT.
              </p>
              <Tip>
                <B>Gain de temps :</B> si ton <B>catalogue de prestations</B> est configuré,
                clique sur <B>Depuis le catalogue</B> pour insérer une prestation en un clic, prix inclus.
                Le catalogue se configure via le menu <B>Catalogue</B> (plan Pro).
              </Tip>
            </Step>
            <Step n={5} title="Vérifie la TVA et les totaux">
              <p>
                Deviso calcule les totaux automatiquement. Vérifie que le taux de TVA est correct
                pour chaque prestation. En franchise de TVA ? Laisse le taux à 0 %, la mention
                légale est ajoutée automatiquement.
              </p>
              <Warning>
                Ne pas vérifier le régime TVA avant d&apos;envoyer. Un devis avec une TVA incorrecte
                oblige à le recréer ou à l&apos;expliquer au client, perte de temps et d&apos;image.
              </Warning>
            </Step>
            <Step n={6} title="Prévisualise et envoie">
              <p>
                Clique sur <B>Aperçu</B> pour voir le PDF tel que ton client le recevra.
                Quand tout est bon, clique sur <B>Envoyer par email</B>, ton client reçoit
                un lien sécurisé pour consulter et signer en ligne.
              </p>
            </Step>
          </Steps>
        </Section>

        <Section title="Les bons réflexes dès le départ">
          <Tip>
            <B>Utilise la génération IA.</B> Décris ta mission en quelques mots{" "}
            (<em>« site vitrine 5 pages + référencement de base »</em>) et Deviso propose
            une structure de lignes prête à affiner. Tu gagnes facilement 5 à 10 minutes
            sur chaque devis.
          </Tip>
          <Tip>
            <B>Ajoute toujours une date de validité.</B> Un devis sans expiration laisse
            ton client procrastiner. 15 à 30 jours est généralement idéal.
          </Tip>
          <Note>
            Ton logo et tes coordonnées s&apos;affichent automatiquement si tu les as renseignés
            dans <B>Paramètres → Profil</B>. Si ton en-tête est vide, commence par là.
          </Note>
        </Section>

        <Section title="Ce que Deviso gère automatiquement">
          <Ul>
            <Li>Numérote tes devis dans l&apos;ordre (DEV-2026-001, DEV-2026-002…)</Li>
            <Li>Calcule HT, TVA et TTC à chaque modification</Li>
            <Li>Génère un PDF professionnel téléchargeable</Li>
            <Li>Te notifie par email dès que ton client ouvre le devis</Li>
            <Li>Permet à ton client de signer électroniquement depuis le lien</Li>
          </Ul>
        </Section>
      </>
    ),
  },

  // ── 2. Devis → facture ────────────────────────────────────────
  "devis-a-facture": {
    title: "Du devis à la facture : acompte et solde",
    description: "Facture en deux temps, acompte puis solde, pour sécuriser tes missions et améliorer ta trésorerie.",
    readingTime: 4,
    cta: { label: "Voir mes devis", href: "/proposals" },
    content: (
      <>
        <Section title="Pourquoi facturer en deux temps ?">
          <p>
            Pour toute mission au-delà de quelques centaines d&apos;euros, l&apos;acompte est
            une bonne pratique professionnelle. Il te permet de :
          </p>
          <Ul>
            <Li>Engager concrètement ton client avant de démarrer</Li>
            <Li>Financer ton démarrage (matériel, sous-traitance, temps)</Li>
            <Li>Réduire le risque d&apos;impayé total</Li>
          </Ul>
          <Tip>
            <B>Repère courant :</B> 30 à 50 % d&apos;acompte pour les missions créatives ou de conseil.
            Pour un projet long (développement, formation), un découpage en trois tiers -
            démarrage / mi-parcours / livraison, fonctionne très bien.
          </Tip>
        </Section>

        <Section title="Créer une facture d'acompte">
          <Steps>
            <Step n={1} title="Ouvre le devis signé">
              <p>
                Dans <B>Devis</B>, ouvre le devis signé par ton client (statut{" "}
                <em>Signé</em>). En bas de page, clique sur <B>Créer une facture d&apos;acompte</B>.
              </p>
            </Step>
            <Step n={2} title="Définis le montant">
              <p>
                Saisis un pourcentage ou un montant fixe. La facture d&apos;acompte reçoit
                automatiquement une numérotation distincte : <em>AC-2026-001</em>.
              </p>
            </Step>
            <Step n={3} title="Envoie-la comme une facture normale">
              <p>
                L&apos;envoi fonctionne exactement comme pour une facture classique.
                Ton client voit le montant à régler et tes coordonnées bancaires ou
                ton lien de paiement.
              </p>
              <Note>
                La facture d&apos;acompte mentionne automatiquement qu&apos;il s&apos;agit d&apos;un acompte
                et fait référence au devis d&apos;origine.
              </Note>
            </Step>
          </Steps>
        </Section>

        <Section title="Créer la facture de solde">
          <Steps>
            <Step n={1} title="Retourne sur le même devis">
              <p>
                Une fois l&apos;acompte réglé (ou à la livraison), retourne sur le devis et
                clique sur <B>Créer une facture de solde</B>.
              </p>
            </Step>
            <Step n={2} title="Le solde est calculé automatiquement">
              <p>
                Deviso déduit automatiquement les acomptes déjà facturés. Le montant
                restant à payer est affiché clairement sur le PDF.
              </p>
            </Step>
            <Step n={3} title="Marque les factures comme payées">
              <p>
                Dès réception du règlement, marque la facture comme <B>Payée</B> dans
                la liste des factures. Indispensable pour que tes stats et le widget
                CA URSSAF restent justes.
              </p>
            </Step>
          </Steps>
          <Tip>
            <B>Bonne pratique :</B> marque une facture payée dès que le virement arrive
            sur ton compte. Ne laisse pas ça s&apos;accumuler, en fin de mois c&apos;est fastidieux à rattraper.
          </Tip>
          <Warning>
            Créer une facture finale avec le montant total sans déduire l&apos;acompte.
            Ton client recevrait une double facturation, source de confusion et de friction inutile.
          </Warning>
        </Section>
      </>
    ),
  },

  // ── 2b. Factures recurrentes ──────────────────────────────────
  "factures-recurrentes": {
    title: "Automatiser ses factures récurrentes",
    description: "Pour tes abonnements, forfaits mensuels et contrats de maintenance : configure la facture une fois, Deviso l'émet automatiquement à chaque échéance.",
    readingTime: 4,
    cta: { label: "Gérer mes récurrentes", href: "/invoices" },
    content: (
      <>
        <Note>
          Les factures récurrentes sont disponibles sur le plan <B>Pro</B>.
          Elles se gèrent dans <B>Factures</B>, onglet <em>Récurrentes</em>.
        </Note>

        <Section title="À quoi ça sert">
          <p>
            Dès que tu factures le même montant au même client à intervalle régulier,
            une facture récurrente t&apos;évite de la recréer à la main chaque mois :
            abonnement, forfait de maintenance, prestation au mois, <em>retainer</em>.
            Tu la configures une fois, Deviso s&apos;occupe du reste.
          </p>
        </Section>

        <Section title="Créer une facture récurrente">
          <Steps>
            <Step n={1} title="Factures → Récurrentes → Nouvelle">
              <p>
                Dans <B>Factures</B>, ouvre l&apos;onglet <em>Récurrentes</em> et clique
                sur <B>Nouvelle récurrente</B>.
              </p>
            </Step>
            <Step n={2} title="Renseigne le client et les lignes">
              <p>
                Nom du client, email, entreprise et adresse, puis les lignes de prestation
                (description, quantité, prix unitaire HT), le taux de TVA, les conditions de
                paiement et une note éventuelle. Exactement comme une facture normale.
              </p>
              <Tip>
                <B>Renseigne l&apos;email du client.</B> C&apos;est lui qui déclenche l&apos;envoi
                automatique (voir plus bas). Sans email, la facture sera créée mais restera à
                envoyer toi-même.
              </Tip>
            </Step>
            <Step n={3} title="Choisis la fréquence et le jour">
              <p>
                Fréquence <B>mensuelle</B>, <B>trimestrielle</B> ou <B>annuelle</B>, et le{" "}
                <B>jour du mois</B> d&apos;émission (par exemple le 1er). La prochaine échéance
                s&apos;affiche sur la fiche.
              </p>
            </Step>
            <Step n={4} title="Enregistre">
              <p>
                L&apos;abonnement est actif immédiatement. Tu peux en créer autant que tu veux,
                un par client ou par contrat.
              </p>
            </Step>
          </Steps>
        </Section>

        <Section title="Ce que Deviso fait automatiquement">
          <div className="space-y-3 mt-1">
            <Card
              icon={Calendar}
              title="Émission à chaque échéance"
              desc="À la date prévue, Deviso crée la facture au format Factur-X, numérotée automatiquement dans ta série habituelle. Aucune action de ta part."
            />
            <Card
              icon={CircleCheck}
              title="Envoi automatique si l'email est renseigné"
              desc="Quand le client a un email, la facture lui part directement, PDF Factur-X en pièce jointe et tes coordonnées de paiement incluses, comme une facture envoyée à la main."
              accent
            />
            <Card
              icon={Info}
              title="Sinon, un brouillon prêt à envoyer"
              desc="Sans email client, la facture est générée en brouillon. Tu la retrouves dans la liste et tu l'envoies quand tu veux."
            />
          </div>
          <Warning>
            Configurer une récurrente sans avoir renseigné tes moyens de paiement dans{" "}
            <B>Paiements</B>. La facture partirait au client sans IBAN ni lien de paiement,
            il ne saurait pas où régler, tous les mois. Configure les paiements d&apos;abord.
          </Warning>
        </Section>

        <Section title="Mettre en pause, modifier, reprendre">
          <p>
            Depuis l&apos;onglet <em>Récurrentes</em>, chaque abonnement peut être{" "}
            <B>mis en pause</B> puis réactivé, ou <B>modifié</B> (montant, fréquence, jour).
            La fiche indique la prochaine échéance et la date de la dernière facture émise.
          </p>
          <Tip>
            <B>À la fin d&apos;un contrat, mets l&apos;abonnement en pause plutôt que de le
            supprimer.</B> Tu gardes l&apos;historique et tu peux le relancer si le client
            reconduit.
          </Tip>
        </Section>
      </>
    ),
  },

  // ── 3. Catalogue ─────────────────────────────────────────────
  "catalogue-prestations": {
    title: "Maîtriser son catalogue de prestations",
    description: "Crée tes prestations et taux horaires une fois, réutilise-les en un clic dans tous tes devis et factures.",
    readingTime: 3,
    cta: { label: "Ouvrir le catalogue", href: "/catalogue" },
    content: (
      <>
        <Note>
          Le catalogue de prestations est disponible sur le plan <B>Pro</B>.
          Accède-y via <B>Catalogue</B> dans le menu.
        </Note>

        <Section title="Deux types de prestations">
          <p>Le catalogue distingue deux façons de facturer :</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Card
              icon={Package}
              title="À l'acte"
              desc="Prix fixe par unité. Ex : page web, logo, article, audit, journée de formation."
            />
            <Card
              icon={Timer}
              title="Taux horaire"
              desc="Prix à l'heure. Lors de l'ajout dans un devis, tu choisis la durée en tranches de 15 min."
              accent
            />
          </div>
        </Section>

        <Section title="Ajouter une prestation à l'acte">
          <Steps>
            <Step n={1} title="Catalogue → + Prestation">
              <p>
                Clique sur <B>+ Prestation</B> dans la section <em>À l&apos;acte</em>.
                Renseigne : nom, description courte (optionnelle), unité (forfait, jour, page…)
                et prix HT.
              </p>
            </Step>
            <Step n={2} title="Insère-la dans un devis">
              <p>
                Dans l&apos;éditeur de devis, clique sur <B>Depuis le catalogue</B>.
                Tes prestations apparaissent, un clic les insère avec leur prix.
              </p>
            </Step>
          </Steps>
          <Tip>
            <B>Nomme tes prestations comme tu les décris à tes clients,</B> pas avec un jargon interne.
            {" "}<em>« Page de contenu SEO 500 mots »</em> est bien plus clair que <em>« Contenu web standard »</em>.
          </Tip>
        </Section>

        <Section title="Ajouter un taux horaire">
          <Steps>
            <Step n={1} title="Catalogue → + Taux horaire">
              <p>
                Saisis le nom de l&apos;activité (ex : <em>Développement</em>,{" "}
                <em>Conseil stratégique</em>, <em>Formation</em>) et ton tarif horaire HT.
              </p>
            </Step>
            <Step n={2} title="Choisis la durée lors de l'ajout dans un devis">
              <p>
                Un sélecteur apparaît : heures (0–23) et minutes (0, 15, 30, 45).
                Deviso calcule le total immédiatement : <em>2h30 × 90 € = 225 €</em>.
              </p>
            </Step>
          </Steps>
          <Tip>
            Crée un taux horaire par activité si tes tarifs varient selon les missions -
            développement front, conseil, formation. Tu gardes une granularité utile sur tes devis.
          </Tip>
        </Section>

        <Section title="Maintenir le catalogue à jour">
          <Warning>
            Ne pas mettre à jour le catalogue quand tes tarifs évoluent. Les nouvelles lignes
            insérées dans tes devis prendront le tarif actuel, si le catalogue est obsolète,
            tu te retrouves à corriger manuellement à chaque fois.
          </Warning>
          <Tip>
            Prends 5 minutes en début d&apos;année pour réviser tes prix. C&apos;est tout.
          </Tip>
        </Section>
      </>
    ),
  },

  // ── 3b. Catalogue & IA ───────────────────────────────────────
  "catalogue-ia": {
    title: "Catalogue de prestations et génération IA : pourquoi ça change tout",
    description: "Comprends comment un catalogue bien renseigné rend tes devis IA plus précis, plus cohérents, et beaucoup plus rapides à valider.",
    readingTime: 5,
    cta: { label: "Ouvrir le catalogue", href: "/catalogue" },
    content: (
      <>
        <Note>
          Le catalogue de prestations est disponible sur le plan <B>Pro</B>.
          Accède-y via <B>Catalogue</B> dans le menu.
        </Note>

        <Section title="Comment l'IA utilise ton catalogue">
          <p>
            Quand tu génères un devis avec l&apos;IA, Deviso ne part pas de zéro. Il injecte automatiquement
            l&apos;ensemble de ton catalogue dans le contexte envoyé au modèle : noms exacts, descriptions,
            tarifs, unités. L&apos;IA sélectionne et assemble les prestations les plus cohérentes avec la
            mission décrite.
          </p>
          <Tip>
            <B>Sans catalogue :</B> l&apos;IA invente des intitulés et des prix de toutes pièces.
            Le résultat demande souvent plus de corrections que le devis lui-même.{" "}
            <B>Avec un catalogue complet :</B> elle retranscrit tes propres prestations, dans tes propres mots,
            à tes propres tarifs. Tu n&apos;as plus qu&apos;à ajuster les quantités.
          </Tip>
        </Section>

        <Section title="Les facteurs qui rendent l'IA plus pertinente">
          <p className="mb-4">Chaque élément du catalogue joue un rôle distinct dans la qualité du résultat :</p>

          <div className="space-y-3">
            <Card
              icon={Tag}
              title="Le nom de la prestation"
              desc="C'est le premier signal que lit l'IA. Un nom précis et reconnaissable guide directement la sélection. « Audit UX complet » est sans ambiguïté, « Prestation consulting » ne l'est pas."
            />
            <Card
              icon={PenLine}
              title="La description"
              desc="Elle permet à l'IA de comprendre le périmètre réel de la prestation. Plus elle est explicite (livrables, délai, cycle de révisions), plus le devis généré reflète fidèlement ce que tu proposes réellement."
            />
            <Card
              icon={Euro}
              title="Le prix unitaire"
              desc="L'IA utilise tes tarifs tels quels, pas de calcul, pas d'approximation. Un prix à jour évite les corrections manuelles systématiques et les montants incohérents entre devis."
              accent
            />
            <Card
              icon={Ruler}
              title="L'unité"
              desc="Forfait, jour, heure, page, livrable… L'unité détermine comment l'IA construit la ligne (quantité × prix). Une unité floue produit des lignes difficiles à justifier au client."
            />
            <Card
              icon={Scale}
              title="La granularité"
              desc="Trop peu de prestations oblige l'IA à regrouper des activités distinctes dans une seule ligne. Trop de variantes crée de l'ambiguïté. L'idéal : une entrée par type de mission clairement délimité."
            />
          </div>
        </Section>

        <Section title="Bonnes pratiques pour un catalogue « IA-ready »">
          <Steps>
            <Step n={1} title="Nommer comme tu parles à tes clients">
              <p>
                Utilise le vocabulaire que tu emploies en rendez-vous client, pas un jargon interne.
                Si tu dis <em>« refonte identité visuelle »</em> en RDV, c&apos;est le nom à mettre dans le catalogue.
                L&apos;IA comprend le langage naturel, et tes clients aussi.
              </p>
            </Step>
            <Step n={2} title="Écrire des descriptions orientées livrable">
              <p>
                Décris ce que le client <em>reçoit</em>, pas ce que tu <em>fais</em>.{" "}
                <em>« Logo vectoriel déclinable + charte graphique (typographies, couleurs, règles d&apos;usage) »</em>{" "}
                est plus exploitable pour l&apos;IA qu&apos;<em>« Travail graphique »</em>.
              </p>
              <Tip>
                Une bonne description de catalogue sert aussi directement aux clients -
                ils lisent les lignes du devis, pas seulement le total.
              </Tip>
            </Step>
            <Step n={3} title="Couvrir l'ensemble de tes types de missions">
              <p>
                Répertorie au minimum une entrée pour chaque catégorie de mission que tu proposes :
                découverte/audit, production principale, livrables additionnels, droits, maintenance.
                Un catalogue incomplet force l&apos;IA à improviser sur les parties manquantes.
              </p>
            </Step>
            <Step n={4} title="Maintenir les prix à jour">
              <p>
                L&apos;IA retranscrit tes tarifs catalogues tels quels dans les devis.
                Un tarif obsolète dans le catalogue se retrouve directement dans le devis généré -
                et devra être corrigé à la main à chaque fois.
              </p>
              <Warning>
                Ne pas mettre à jour le catalogue après une révision tarifaire.
                Tu te retrouves à corriger le prix sur chaque nouveau devis, c&apos;est le
                catalogue lui-même qui aurait dû être mis à jour.
              </Warning>
            </Step>
          </Steps>
        </Section>

        <Section title="Impact concret sur tes devis">
          <Note>
            En pratique, un catalogue de 8 à 12 prestations bien renseignées suffit pour
            que la génération IA produise un premier jet utilisable à 80–90 % sans correction majeure.
            Tu ne retouches que les quantités et les notes spécifiques à la mission.
          </Note>
          <Tip>
            <B>Astuce :</B> génère un devis IA sur une mission récente. Compare le résultat avec
            le devis que tu aurais écrit manuellement. Les écarts te montrent exactement ce qui
            manque dans ton catalogue, c&apos;est le meilleur audit possible.
          </Tip>
        </Section>
      </>
    ),
  },

  // ── 4. Paiements clients ──────────────────────────────────────
  "paiements-clients": {
    title: "Configurer ses paiements clients",
    description: "Configure en quelques minutes comment tes clients règlent tes factures, virement, lien de paiement, ou les deux.",
    readingTime: 3,
    cta: { label: "Configurer les paiements", href: "/paiements" },
    content: (
      <>
        <Section title="Trois options disponibles">
          <p>Dans la section <B>Paiements</B>, tu définis ce qui apparaît sur chaque facture envoyée :</p>
          <div className="space-y-3 mt-3">
            <Card
              icon={Landmark}
              title="Virement bancaire (IBAN)"
              desc="IBAN + BIC + titulaire. Le client vire directement. Aucune commission, délai de 1 à 3 jours ouvrés."
            />
            <Card
              icon={Link2}
              title="Lien de paiement"
              desc="Un lien vers Stripe, Sumeria, PayPal… Le client paie par carte en ligne. Plus rapide, mais frais de transaction selon la plateforme."
            />
            <Card
              icon={CircleCheck}
              title="Les deux"
              desc="Le client choisit sa méthode. Recommandé pour maximiser les chances d'encaissement rapide."
            />
          </div>
        </Section>

        <Section title="Comment configurer">
          <Steps>
            <Step n={1} title="Ouvre la section Paiements">
              <p>
                Dans le menu, clique sur <B>Paiements</B>.
                Tu arrives sur la page de configuration.
              </p>
            </Step>
            <Step n={2} title="Choisis ton mode">
              <p>
                Sélectionne <em>Virement</em>, <em>Lien</em> ou <em>Les deux</em>.
                Le formulaire s&apos;adapte immédiatement à ton choix.
              </p>
            </Step>
            <Step n={3} title="Renseigne tes informations">
              <p>
                Pour le virement : IBAN, BIC, nom du titulaire.
                Pour le lien : choisis la plateforme (Stripe, Sumeria, PayPal, Lydia…)
                et colle l&apos;URL de ton profil ou lien de paiement.
              </p>
            </Step>
            <Step n={4} title="Enregistre, c'est immédiatement actif">
              <p>
                Toutes tes prochaines factures incluront automatiquement un bloc avec
                tes coordonnées de paiement. L&apos;email de facture intègre également
                les instructions claires pour le règlement.
              </p>
            </Step>
          </Steps>
        </Section>

        <Section title="Conseils pratiques">
          <Tip>
            <B>Propose les deux modes.</B> Certains clients préfèrent le virement, d&apos;autres
            paient par carte en 30 secondes. En laissant le choix, tu réduis les frictions
            et tu encaisses plus vite.
          </Tip>
          <Tip>
            <B>Le lien de paiement pour les petites factures.</B> En dessous de 200 €,
            un règlement par carte arrive souvent le jour même. Le virement prend 2–3 jours.
          </Tip>
          <Warning>
            Saisir ton IBAN sans le vérifier soigneusement. Une seule erreur, et le virement
            de ton client rebondit. Double-vérifie toujours avant d&apos;enregistrer.
          </Warning>
        </Section>
      </>
    ),
  },

  // ── 5. Personnaliser documents ────────────────────────────────
  "personnaliser-documents": {
    title: "Personnaliser son profil et ses documents",
    description: "Logo, couleurs, CGV : soigne l'image de ton entreprise sur chaque devis et facture envoyée à tes clients.",
    readingTime: 3,
    cta: { label: "Aller dans Paramètres", href: "/profil" },
    content: (
      <>
        <Section title="Les informations indispensables">
          <p>
            Va dans <B>Paramètres → Profil</B> et commence par renseigner ces quatre éléments
           , ils apparaissent sur tous tes documents :
          </p>
          <div className="space-y-2 mt-3">
            {[
              { label: "Nom / raison sociale", detail: "En-tête de chaque devis et facture" },
              { label: "Adresse complète", detail: "Mention obligatoire sur les factures en France" },
              { label: "Numéro SIRET", detail: "Obligatoire sur les factures" },
              { label: "Numéro de TVA", detail: "Si tu y es assujetti" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 py-2.5 border-b border-ds-border last:border-0">
                <span className="text-indigo-500 text-xs mt-0.5 shrink-0">✓</span>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <Warning>
            Envoyer des devis avec un profil vide. Sans nom, sans adresse ni SIRET, ton document
            n&apos;est pas valide légalement, et l&apos;image renvoyée est peu professionnelle.
          </Warning>
        </Section>

        <Section title="Ajouter ton logo">
          <Steps>
            <Step n={1} title="Téléverse ton logo dans Paramètres">
              <p>
                Dans <B>Paramètres → Profil</B>, clique sur <em>Ajouter un logo</em>.
                Formats acceptés : PNG ou JPG. Préfère un PNG avec fond transparent
                pour un rendu optimal.
              </p>
            </Step>
            <Step n={2} title="Vérifie l'aperçu sur un PDF">
              <p>
                Crée un devis test et clique sur <B>Aperçu</B> pour confirmer
                que ton logo s&apos;affiche correctement.
              </p>
            </Step>
          </Steps>
          <Tip>
            <B>Taille recommandée :</B> entre 200 et 600 px de large. Trop grand, il sera
            redimensionné. Trop petit, il sera flou. Le format 400 × 200 px est parfait
            dans la grande majorité des cas.
          </Tip>
        </Section>

        <Section title="Couleur d'accent personnalisée (Pro)">
          <p>
            Sur le plan Pro, tu peux choisir une couleur qui s&apos;applique sur tes devis et
            factures PDF, en-têtes, séparateurs, boutons dans les emails.
          </p>
          <Tip>
            Utilise la couleur principale de ton identité visuelle. Tes documents auront
            une cohérence immédiate avec ton site et tes supports de communication.
          </Tip>
        </Section>

        <Section title="Ajouter tes CGV">
          <p>
            Dans <B>Paramètres → Profil</B>, descends jusqu&apos;à la section <em>CGV</em>. Tu peux
            utiliser le modèle Deviso (8 articles adaptés aux freelances) ou coller tes propres CGV.
          </p>
          <p>
            Une fois activées, tes CGV sont automatiquement annexées à chaque PDF de devis, avec
            la mention : <em>« L&apos;acceptation de ce devis vaut acceptation de nos CGV annexées. »</em>
          </p>
          <Tip>
            <B>À faire dès le départ.</B> Les CGV définissent les conditions de paiement, le droit
            applicable et les pénalités de retard. Sans elles, tu n&apos;as aucun recours contractuel
            clair en cas de litige.
          </Tip>
        </Section>
      </>
    ),
  },

  // ── 6. Suivre & relancer ──────────────────────────────────────
  "suivre-relancer-devis": {
    title: "Suivre et relancer ses devis",
    description: "Sache exactement où en est chaque devis, et relance tes clients au bon moment pour maximiser ton taux de transformation.",
    readingTime: 4,
    cta: { label: "Voir mes devis", href: "/proposals" },
    content: (
      <>
        <Section title="Les statuts d'un devis">
          <p>Chaque devis évolue à travers ces statuts, visibles dans la liste :</p>
          <div className="mt-3 rounded-xl border border-ds-border overflow-hidden">
            {[
              { label: "Brouillon", color: "text-gray-400", desc: "Non envoyé. Visible uniquement par toi." },
              { label: "Envoyé", color: "text-blue-400", desc: "Ton client a reçu le lien. Deviso te notifie quand il l'ouvre." },
              { label: "Consulté", color: "text-amber-400", desc: "Ouvert au moins une fois. Le bon moment pour relancer." },
              { label: "Signé", color: "text-emerald-400", desc: "Signé électroniquement par le client. Tu peux facturer." },
              { label: "Refusé", color: "text-red-400", desc: "Le client a refusé. Prends contact pour comprendre." },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-4 py-3 border-b border-ds-border last:border-0 bg-ds-surface">
                <span className={`text-xs font-semibold shrink-0 w-14 ${s.color}`}>{s.label}</span>
                <span className="text-xs text-gray-500">{s.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="La notification d'ouverture, ton meilleur signal">
          <p>
            Dès que ton client ouvre le devis, Deviso t&apos;envoie une notification email.
            C&apos;est ton signal d&apos;action.
          </p>
          <Tip>
            <B>Relance dans les 24–48h après l&apos;ouverture.</B> Le devis est frais en tête de
            ton client, c&apos;est le meilleur moment pour un appel rapide ou un email d&apos;accompagnement.
            Ton taux de transformation sera nettement plus élevé qu&apos;en relançant à froid une semaine plus tard.
          </Tip>
        </Section>

        <Section title="Relances automatiques (Pro)">
          <Steps>
            <Step n={1} title="Paramètres → Profil → Relances automatiques">
              <p>
                Dans <B>Paramètres → Profil</B>, descends jusqu&apos;à la section{" "}
                <em>Relances automatiques</em>. Configure tes délais (en jours après envoi) :
                par exemple <em>J+3, J+7, J+14</em>.
              </p>
            </Step>
            <Step n={2} title="Personnalise le message">
              <p>
                Rédige un message court et professionnel. Reste dans un registre de service
                et de disponibilité, pas de pression.
              </p>
            </Step>
            <Step n={3} title="Les relances s'arrêtent automatiquement">
              <p>
                Dès que le client accepte ou refuse, les relances programmées s&apos;arrêtent.
                Aucune action manuelle nécessaire.
              </p>
            </Step>
          </Steps>
          <Tip>
            <B>Séquence efficace :</B> J+3 (rappel doux), J+7 (invitation à appeler si questions),
            J+14 (dernier message avant archivage). Simple, discret, efficace.
          </Tip>
        </Section>

        <Section title="Relance manuelle">
          <p>
            Ouvre n&apos;importe quel devis en statut <em>Envoyé</em> ou <em>Consulté</em> et clique
            sur <B>Relancer</B>. Un email est envoyé instantanément avec le lien vers le devis.
          </p>
          <Warning>
            Relancer trop souvent ou avec un ton pressant. Une relance tous les 3–5 jours
            ouvrés est largement suffisante. Au-delà, tu risques de braquer le client.
          </Warning>
        </Section>
      </>
    ),
  },

  // ── 7. Équipe ─────────────────────────────────────────────────
  "gerer-equipe": {
    title: "Gérer son équipe sur Deviso",
    description: "Invite des collaborateurs et règle, acte par acte, ce que chacun a le droit de faire dans ton espace.",
    readingTime: 4,
    cta: { label: "Gérer l'équipe", href: "/team" },
    content: (
      <>
        <Note>
          La gestion d&apos;équipe est disponible sur le plan <B>Pro</B>.
          Le propriétaire + 2 membres sont inclus. Chaque siège supplémentaire est à 5 €/mois.
        </Note>

        <Section title="Deux rôles, des autorisations à la carte">
          <div className="space-y-3 mt-1">
            <Card
              icon={Crown}
              title="Titulaire (toi)"
              desc="Accès complet : abonnement Deviso, paiements, clients, activité, paramètres, identité de l'entreprise et gestion de l'équipe. Certains actes sensibles (encaissement, comptabilité, suppression, raccordement) te restent toujours réservés."
            />
            <Card
              icon={User}
              title="Membre"
              desc="Crée et prépare devis et factures, accède au catalogue et modifie son profil. Pour chaque membre, tu coches précisément les actes qu'il a le droit de réaliser. Il n'a jamais accès à l'abonnement, à l'activité globale ni aux paramètres de l'entreprise."
            />
          </div>
          <Tip>
            Le rôle Membre est idéal pour un associé, un alternant ou un commercial.
            Il peut préparer des devis en ton nom sans accéder à tes données financières sensibles.
          </Tip>
        </Section>

        <Section title="Inviter un membre">
          <Steps>
            <Step n={1} title="Équipe → Inviter un membre">
              <p>
                Clique sur <B>Inviter un membre</B> et saisis l&apos;adresse email
                de la personne.
              </p>
            </Step>
            <Step n={2} title="Le membre reçoit un email d'invitation">
              <p>
                Il crée son compte Deviso (ou se connecte s&apos;il en a déjà un)
                et est rattaché automatiquement à ton workspace.
              </p>
            </Step>
            <Step n={3} title="Tout reste dans ton espace">
              <p>
                Les devis et factures créés par les membres apparaissent dans{" "}
                <em>tes</em> listes, avec la mention du créateur.
              </p>
            </Step>
          </Steps>
        </Section>

        <Section title="Régler les autorisations d'un membre">
          <p>
            Dans <B>Équipe</B>, chaque membre dispose d&apos;une grille d&apos;autorisations.
            Tu coches, acte par acte, ce qu&apos;il a le droit de faire. L&apos;enregistrement
            est immédiat à chaque changement.
          </p>
          <Steps>
            <Step n={1} title="Ouvre la fiche du membre">
              <p>
                Dans l&apos;onglet <B>Membres</B>, déplie la grille d&apos;autorisations
                du collaborateur concerné.
              </p>
            </Step>
            <Step n={2} title="Coche les actes autorisés">
              <p>
                Par défaut, un membre <em>prépare</em> devis et factures sans pouvoir les envoyer.
                Tu peux l&apos;autoriser à <B>envoyer un devis</B> et à <B>envoyer une facture</B>{" "}
                lui-même. D&apos;autres actes liés à la facturation électronique apparaissent au fur
                et à mesure que ces fonctions sont activées sur ton compte.
              </p>
            </Step>
            <Step n={3} title="C'est appliqué immédiatement">
              <p>
                Aucun bouton à valider : chaque case cochée ou décochée prend effet tout de suite.
                Sans autorisation d&apos;envoi, le membre prépare le document et c&apos;est toi qui l&apos;envoies.
              </p>
            </Step>
          </Steps>
          <Tip>
            Laisse les autorisations d&apos;envoi décochées pour un membre junior ou en période d&apos;essai :
            tu gardes la main sur ce qui part chez le client. Coche-les pour les collaborateurs de
            confiance afin de ne pas ralentir le flux.
          </Tip>
        </Section>
      </>
    ),
  },

  // ── 8. Exports comptables ─────────────────────────────────────
  "exports-comptables": {
    title: "Exporter sa comptabilité",
    description: "Génère les fichiers dont ton comptable a besoin en quelques clics, FEC, CSV factures, récap mensuel.",
    readingTime: 3,
    cta: { label: "Voir les exports", href: "/stats" },
    content: (
      <>
        <Note>
          L&apos;<B>export FEC</B> est inclus dès le plan <B>Solo</B>. Les exports{" "}
          <B>CSV factures</B> et <B>récapitulatif mensuel</B> sont réservés au plan <B>Pro</B>.
        </Note>

        <Section title="Les trois exports disponibles">
          <div className="space-y-3 mt-1">
            <Card
              icon={ClipboardList}
              title="Export FEC"
              desc="Fichier des Écritures Comptables. Format imposé par l'administration fiscale. Ton expert-comptable s'en sert pour clôturer l'exercice, et l'administration peut l'exiger en cas de contrôle."
            />
            <Card
              icon={BarChart3}
              title="Export CSV factures"
              desc="Toutes tes factures au format tableur (Excel / Google Sheets). Pratique pour un suivi personnel ou pour ton comptable."
            />
            <Card
              icon={Calendar}
              title="Récap mensuel"
              desc="Résumé mois par mois : CA, nombre de factures, montants HT et TVA. Idéal pour tes déclarations trimestrielles ou mensuelles."
            />
          </div>
        </Section>

        <Section title="Générer un export">
          <Steps>
            <Step n={1} title="Activité → Exports comptables">
              <p>
                Depuis le menu <B>Activité</B>, descends jusqu&apos;à la section{" "}
                <em>Exports comptables</em>.
              </p>
            </Step>
            <Step n={2} title="Sélectionne la période">
              <p>
                Choisis l&apos;année ou la plage de dates. Pour le FEC, l&apos;exercice comptable
                standard va du 1er janvier au 31 décembre.
              </p>
            </Step>
            <Step n={3} title="Télécharge">
              <p>
                Clique sur <B>Télécharger</B>. Le fichier est généré instantanément.
              </p>
            </Step>
            <Step n={4} title="Transmets à ton comptable">
              <p>
                Pour le FEC, envoie le fichier directement à ton expert-comptable.
                Il n&apos;a besoin de rien d&apos;autre pour traiter ta comptabilité.
              </p>
            </Step>
          </Steps>
        </Section>

        <Section title="Bonnes pratiques">
          <Tip>
            <B>Un export mensuel systématique.</B> 5 minutes en fin de mois pour télécharger
            le récap et le stocker sur Drive ou iCloud. Tu auras toujours une trace propre
            en cas de contrôle ou de question de ton comptable.
          </Tip>
          <Tip>
            <B>Marque les factures payées au fil de l&apos;eau.</B> La fiabilité de tes exports
            dépend directement des statuts dans Deviso. Une facture non marquée comme payée
            fausse ton CA déclaré.
          </Tip>
          <Warning>
            Attendre la fin d&apos;année pour faire tes exports. Corriger une erreur sur une
            facture de mars en décembre, c&apos;est bien plus laborieux que de l&apos;identifier dans le mois.
          </Warning>
          <Note>
            Les factures Deviso sont au format <B>Factur-X EN 16931</B> (PDF/A-3 avec données XML
            embarquées), conformes à la réforme de facturation électronique 2026.
          </Note>
        </Section>
      </>
    ),
  },

  // ── 9b. Reforme (vue d'ensemble, visible) ─────────────────────
  "reforme-facturation-electronique": {
    title: "La réforme de la facturation électronique 2026",
    description: "Ce qui change pour ton entreprise, le calendrier selon ta taille, et ce que Deviso gère déjà pour te mettre en conformité sans effort.",
    readingTime: 5,
    cta: { label: "Voir mes factures", href: "/invoices" },
    content: (
      <>
        <Section title="De quoi on parle">
          <p>
            La réforme généralise la <B>facturation électronique</B> entre entreprises (B2B)
            en France. Concrètement, deux obligations distinctes :
          </p>
          <Ul>
            <Li>
              <B>La facture électronique :</B> une facture entre entreprises ne s&apos;échange
              plus par un simple PDF envoyé par email, mais dans un format structuré, transmise
              via une plateforme dédiée.
            </Li>
            <Li>
              <B>L&apos;e-reporting :</B> pour certaines opérations (clients particuliers,
              clients étrangers), les données de la transaction sont transmises à
              l&apos;administration fiscale.
            </Li>
          </Ul>
        </Section>

        <Section title="Le calendrier">
          <div className="mt-1 rounded-xl border border-ds-border overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3 border-b border-ds-border bg-ds-surface">
              <span className="text-xs font-semibold shrink-0 w-28 text-indigo-400">1er sept. 2026</span>
              <span className="text-xs text-gray-400 leading-relaxed">
                <B>Toutes</B> les entreprises doivent pouvoir <B>recevoir</B> une facture
                électronique. Les <B>grandes entreprises</B> et les <B>ETI</B> doivent aussi
                commencer à en <B>émettre</B>.
              </span>
            </div>
            <div className="flex items-start gap-3 px-4 py-3 bg-ds-surface">
              <span className="text-xs font-semibold shrink-0 w-28 text-indigo-400">1er sept. 2027</span>
              <span className="text-xs text-gray-400 leading-relaxed">
                L&apos;obligation d&apos;<B>émettre</B> s&apos;étend aux <B>PME</B> et aux{" "}
                <B>micro-entreprises</B>.
              </span>
            </div>
          </div>
          <Note>
            Aucune exception de régime : micro-entrepreneurs et franchise en base de TVA sont
            concernés comme les autres. La réception, elle, s&apos;applique à tout le monde depuis 2026.
          </Note>
        </Section>

        <Section title="Ce que Deviso fait déjà pour toi">
          <div className="space-y-3 mt-1">
            <Card
              icon={CircleCheck}
              title="Format Factur-X conforme"
              desc="Tes factures sont générées au format Factur-X (norme EN 16931, PDF/A-3), celui qu'impose la réforme. Côté document, tu es déjà prêt, sans rien changer à ta façon de facturer."
              accent
            />
            <Card
              icon={Landmark}
              title="Marchés publics"
              desc="Pour le secteur public (B2G), le dépôt sur Chorus Pro se fait déjà depuis Deviso. Ce circuit existe avant la réforme et continue."
            />
          </div>
        </Section>

        <Section title="Ce qui arrive dans Deviso">
          <p>
            Deviso est une <B>solution compatible</B> adossée à une <B>Plateforme Agréée</B>,
            l&apos;intermédiaire immatriculé par l&apos;administration qui achemine les factures
            et transmet les données au fisc. Quand le raccordement sera activé sur ton compte,{" "}
            <B>l&apos;émission</B> de tes factures, la <B>réception</B> de celles de tes
            fournisseurs et l&apos;<B>e-reporting</B> se feront directement depuis Deviso, sans
            changer ta façon de travailler.
          </p>
          <Tip>
            Tu n&apos;as rien à installer ni à anticiper techniquement : le raccordement se fera
            en quelques clics depuis tes paramètres, et on te préviendra dès qu&apos;il sera
            disponible sur ton compte.
          </Tip>
        </Section>

        <Section title="Ce que tu peux faire dès maintenant">
          <Ul>
            <Li>Compléter ton profil : SIRET, numéro de TVA, adresse, régime fiscal.</Li>
            <Li>Garder ton catalogue et tes tarifs à jour pour des factures propres.</Li>
            <Li>Configurer tes moyens de paiement, pour que chaque facture parte complète.</Li>
          </Ul>
          <Note>
            En clair : continue de facturer normalement dans Deviso. La mise en conformité se
            fera en arrière-plan le moment venu, tu n&apos;as pas à t&apos;en préoccuper aujourd&apos;hui.
          </Note>
        </Section>
      </>
    ),
  },

  // ── 10. Réforme : émettre via la Plateforme Agréée ─────────────
  "conformite-plateforme-agreee": {
    title: "Réforme 2026 : émettre via la Plateforme Agréée",
    description: "Comment Deviso transmet tes factures à l'administration, et comment suivre leur cycle de vie.",
    readingTime: 5,
    cta: { label: "Voir ma conformité", href: "/declarations" },
    content: (
      <>
        <Section title="Ce que change la réforme">
          <p>
            À partir de la réforme, une facture entre entreprises ne s&apos;envoie plus
            simplement par email : elle transite par une <B>Plateforme Agréée</B> (PA),
            immatriculée par l&apos;administration, qui la dépose et transmet les données au fisc.
          </p>
          <p>
            Deviso est une <B>solution compatible</B> adossée à <B>Super PDP</B>, une plateforme
            agréée. Concrètement : tu continues de créer tes factures dans Deviso, et la
            transmission se fait en arrière-plan, une fois ton entreprise raccordée.
          </p>
        </Section>

        <Section title="Raccorder ton entreprise">
          <Steps>
            <Step n={1} title="Paramètres → raccordement">
              <p>
                Depuis <B>Paramètres</B>, lance le raccordement à la Plateforme Agréée. Tu
                autorises Deviso à agir pour ton compte via une connexion sécurisée (OAuth) :
                aucun mot de passe n&apos;est stocké.
              </p>
            </Step>
            <Step n={2} title="Vérification">
              <p>
                La plateforme vérifie le rattachement de ton entreprise à ton compte,
                généralement sous 24 h. Tu peux continuer à travailler pendant ce temps.
              </p>
            </Step>
            <Step n={3} title="Régime de TVA">
              <p>
                Renseigne ta périodicité de TVA dans ton profil : elle fixe le calendrier de
                tes déclarations. En franchise en base, rien à déclarer de ce côté.
              </p>
            </Step>
          </Steps>
        </Section>

        <Section title="Émettre une facture">
          <p>
            Une fois raccordé, chaque facture peut être transmise à la Plateforme Agréée en un
            clic. Deviso génère le fichier Factur-X et le dépose pour toi.
          </p>
          <Tip>
            <B>Adresse du destinataire :</B> pour une entreprise française, le SIREN du client
            suffit. Renseigne-le sur la facture pour qu&apos;elle soit acheminée correctement.
          </Tip>
          <Warning>
            Sans raccordement vérifié, la transmission n&apos;est pas possible. Le raccordement se
            fait une seule fois, depuis tes paramètres.
          </Warning>
        </Section>

        <Section title="Suivre le cycle de vie">
          <p>
            Une facture transmise passe par plusieurs états (déposée, reçue, encaissée, ou
            refusée). Tu les suis directement sur la facture, et un refus est signalé
            clairement : c&apos;est la seule situation qui demande une action de ta part.
          </p>
        </Section>
      </>
    ),
  },

  // ── 11. Factures reçues ────────────────────────────────────────
  "factures-recues": {
    title: "Recevoir les factures de tes fournisseurs",
    description: "Depuis septembre 2026, toute entreprise doit pouvoir recevoir des factures électroniques. Voici comment ça marche dans Deviso.",
    readingTime: 3,
    cta: { label: "Ouvrir Factures reçues", href: "/factures-recues" },
    content: (
      <>
        <Section title="Une obligation pour tout le monde">
          <p>
            Depuis le 1er septembre 2026, toute entreprise assujettie à la TVA doit pouvoir
            <B> recevoir</B> une facture électronique via une plateforme agréée. Sans exception
            de taille ni de régime : micro-entrepreneurs et franchise en base comprises.
          </p>
        </Section>

        <Section title="Où les trouver">
          <p>
            Les factures que tes fournisseurs t&apos;adressent arrivent dans l&apos;onglet{" "}
            <B>Factures reçues</B>, dès que ton entreprise est raccordée à la Plateforme Agréée.
          </p>
        </Section>

        <Section title="Répondre à une facture">
          <p>
            Recevoir une facture et être d&apos;accord ne demande <B>aucune action</B> : rien
            n&apos;expire, rien n&apos;avance tout seul. La seule action réelle sert au cas où
            quelque chose cloche.
          </p>
          <Ul>
            <Li><B>Mettre en attente :</B> le temps d&apos;obtenir une pièce ou une précision, réversible.</Li>
            <Li><B>Contester :</B> signaler ton désaccord sans annuler la facture.</Li>
            <Li><B>Refuser :</B> définitif, la facture est annulée auprès de l&apos;administration.</Li>
          </Ul>
          <Warning>
            Le refus est terminal et oblige ton fournisseur à passer un avoir. Préfère
            « mettre en attente » ou « contester » tant qu&apos;un accord reste possible.
          </Warning>
        </Section>
      </>
    ),
  },

  // ── 12. Déclarations / e-reporting ─────────────────────────────
  "declarations-ereporting": {
    title: "Tes déclarations au fisc (e-reporting)",
    description: "Ce que la Plateforme Agréée déclare pour toi, et le peu qui reste à ta charge.",
    readingTime: 3,
    cta: { label: "Voir mes déclarations", href: "/declarations" },
    content: (
      <>
        <Section title="Ce que c'est">
          <p>
            L&apos;e-reporting, c&apos;est la transmission au fisc des données de transaction et de
            paiement. Pour tout ce que tu factures via la Plateforme Agréée, tu n&apos;as{" "}
            <B>rien à envoyer</B> : transmettre la facture suffit, la plateforme s&apos;occupe du reste.
          </p>
        </Section>

        <Section title="Où le suivre">
          <p>
            L&apos;onglet <B>Déclarations</B> te montre ce qui a été déclaré en ton nom et l&apos;état
            de chaque envoi. Les déclarations partent selon un calendrier qui dépend de ta
            périodicité de TVA.
          </p>
          <Tip>
            La seule chose qui demande ton attention est un <B>refus</B> de l&apos;administration :
            c&apos;est la seule alerte qui existe sur ce sujet, et elle est affichée clairement.
          </Tip>
        </Section>

        <Section title="Ce qui reste à ta charge">
          <p>
            Une exception : tes <B>achats auprès de fournisseurs étrangers</B> se déclarent par
            tes soins (leur facture ne passe pas par ta Plateforme Agréée). Deviso le gère aussi,
            voir le guide dédié.
          </p>
        </Section>
      </>
    ),
  },

  // ── 13. Achats à l'étranger ────────────────────────────────────
  "achats-etranger": {
    title: "Déclarer tes achats à l'étranger",
    description: "Quand tu achètes hors de France, l'acquisition se déclare par tes soins. Voici comment Deviso s'en occupe.",
    readingTime: 3,
    cta: { label: "Saisir un achat", href: "/achats-internationaux" },
    content: (
      <>
        <Section title="L'obligation">
          <p>
            Si tu achètes un bien ou un service à un fournisseur établi hors de France, tu dois
            déclarer cette acquisition toi-même (article 290-II du CGI). Sa facture ne passe pas
            par ta Plateforme Agréée : elle t&apos;arrive par email, comme avant.
          </p>
        </Section>

        <Section title="Saisir un achat">
          <Steps>
            <Step n={1} title="Achats à l'étranger → Saisir un achat">
              <p>Renseigne le fournisseur, son pays et son numéro de TVA s&apos;il est connu.</p>
            </Step>
            <Step n={2} title="Recopie les montants">
              <p>Date de la facture, montant HT, taux et montant de TVA, et la nature (biens ou services).</p>
            </Step>
            <Step n={3} title="Enregistre">
              <p>L&apos;achat est conservé et sa déclaration d&apos;acquisition est préparée pour l&apos;administration.</p>
            </Step>
          </Steps>
          <Tip>
            <B>Autoliquidation :</B> pour un service intra-UE, la facture du fournisseur porte
            souvent 0 de TVA (tu autoliquides). Dans ce cas, laisse le montant de TVA à 0.
          </Tip>
        </Section>
      </>
    ),
  },
};

// ── Page ──────────────────────────────────────────────────────────

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <MarkAsRead slug={slug} />

      {/* Back */}
      <Link
        href="/prise-en-main"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Retour à la prise en main
      </Link>

      {/* Panneau de lecture opaque : le texte ne doit pas etre pose sur le
          fond a relief, il perdrait en lisibilite. */}
      <article className="bg-ds-surface border border-ds-border rounded-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 uppercase tracking-wide">
            Guide Deviso
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={11} />
            {article.readingTime} min de lecture
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white leading-snug">{article.title}</h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-lg">{article.description}</p>
        <div className="mt-5 h-px bg-ds-border" />
      </div>

      {/* Content */}
      <div>{article.content}</div>

      {/* CTA */}
      {article.cta && (
        <div className="mt-6 p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-4">
          <p className="text-sm text-indigo-300 font-medium">Prêt à essayer ?</p>
          <Link
            href={article.cta.href}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            {article.cta.label}
          </Link>
        </div>
      )}

      </article>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-ds-border flex items-center justify-between">
        <Link
          href="/prise-en-main"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Voir tous les guides
        </Link>
      </div>
    </div>
  );
}