/**
 * Aperçus de l'application pour la section Fonctionnalités, composés en HTML
 * avec les couleurs de l'app plutôt que capturés : nets à toute taille,
 * lisibles sur téléphone, et alimentés par un seul jeu de données cohérent
 * avec le parcours (Studio Durand, devis du Cabinet Lefèvre Avocats,
 * catalogue qui donne les mêmes prix).
 *
 * Toutes les mesures sont en em ; la taille de base suit la largeur du cadre.
 */
export type CleEcran = "tableau" | "factures" | "recues" | "catalogue";

const P = "\u00a0€"; // espace insécable avant l'euro, comme dans le reste de la page

type Pastille = "vert" | "bleu" | "ambre" | "gris";
const PASTILLE: Record<Pastille, string> = {
  vert: "bg-indigo-500/15 text-indigo-300",
  bleu: "bg-blue-500/15 text-blue-300",
  ambre: "bg-amber-500/15 text-amber-300",
  gris: "bg-ink/10 text-gray-300",
};

function Puce({ ton, children }: { ton: Pastille; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-[0.75em] py-[0.2em] text-[0.8em] font-semibold whitespace-nowrap ${PASTILLE[ton]}`}>{children}</span>;
}

function Entete({ titre, sous }: { titre: string; sous: string }) {
  return (
    <div>
      <div className="text-[1.6em] leading-tight font-semibold tracking-[-0.02em] text-ink">{titre}</div>
      <div className="mt-[0.2em] text-gray-400">{sous}</div>
    </div>
  );
}

function Tuile({ label, valeur, ton }: { label: string; valeur: string; ton?: Pastille }) {
  return (
    <div className="rounded-[0.6em] bg-ds-elevated px-[1em] py-[0.85em] min-w-0 flex items-baseline justify-between gap-[1em] @[420px]:block">
      <div className="text-[0.85em] text-gray-400 @[420px]:truncate">{label}</div>
      <div className={`@[420px]:mt-[0.25em] text-[1.35em] font-semibold tabular-nums whitespace-nowrap ${ton === "ambre" ? "text-amber-300" : "text-ink"}`}>{valeur}</div>
    </div>
  );
}

function Ligne({ a, b, c, d }: { a: string; b: string; c: React.ReactNode; d: string }) {
  return (
    <div className="flex items-center justify-between gap-[1em] rounded-[0.6em] bg-ds-elevated px-[1em] py-[0.75em]">
      <div className="min-w-0">
        <div className="text-ink font-medium truncate">{a}</div>
        <div className="text-[0.85em] text-gray-400 tabular-nums truncate">{b}</div>
      </div>
      <div className="flex flex-col-reverse items-end gap-[0.3em] @[420px]:flex-row @[420px]:items-center @[420px]:gap-[0.8em] shrink-0">
        <span>{c}</span>
        <span className="text-ink font-semibold tabular-nums whitespace-nowrap">{d}</span>
      </div>
    </div>
  );
}

function Tableau() {
  return (
    <>
      <Entete titre="Tableau de bord" sous="Lundi 16 novembre" />
      <div className="mt-[1.2em] rounded-[0.6em] bg-ds-elevated px-[1em] py-[0.85em]">
        <div className="text-[0.85em] text-gray-400">Cabinet Martel, ton expert-comptable</div>
        <div className="mt-[0.2em] text-ink">Il manque le justificatif de la facture FAC-2026-027. Peux-tu l&apos;ajouter&nbsp;?</div>
      </div>
      <div className="mt-[0.8em] rounded-[0.6em] bg-indigo-500/10 px-[1.1em] py-[1em]">
        <div className="text-[0.85em] text-gray-300">Chiffre d&apos;affaires encaissé, 2026</div>
        <div className="mt-[0.15em] flex items-end justify-between gap-[1em]">
          <div className="text-[2.4em] leading-none font-semibold tracking-[-0.03em] tabular-nums text-ink">64 300{P}</div>
          <div className="flex items-end gap-[0.35em] h-[2.6em]" aria-hidden="true">
            {[52, 38, 70, 49, 36, 75, 64].map((h, k) => (
              <span key={k} className={`w-[0.7em] rounded-t-[0.2em] ${k === 6 ? "bg-indigo-400" : "bg-indigo-500/45"}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[0.8em] grid grid-cols-1 @[420px]:grid-cols-3 gap-[0.45em] @[420px]:gap-[0.6em]">
        <Tuile label="À encaisser" valeur={`7 200${P}`} />
        <Tuile label="Devis en attente" valeur={`3 200${P}`} />
        <Tuile label="TVA à déclarer" valeur="En décembre" ton="ambre" />
      </div>
      <div className="mt-[0.8em] grid gap-[0.45em]">
        <Ligne a="Cabinet Lefèvre Avocats" b="Payée le 14/11" c={<Puce ton="vert">Payée</Puce>} d={`5 400,00${P}`} />
      </div>
    </>
  );
}

function Factures() {
  return (
    <>
      <Entete titre="Factures" sous="Chaque facture et son statut" />
      <div className="mt-[1.2em] grid grid-cols-1 @[420px]:grid-cols-3 gap-[0.45em] @[420px]:gap-[0.6em]">
        <Tuile label="Encaissé 2026, HT" valeur={`64 300${P}`} />
        <Tuile label="En attente" valeur={`7 200${P}`} />
        <Tuile label="Relancées" valeur="1" ton="ambre" />
      </div>
      <div className="mt-[0.8em] grid gap-[0.45em]">
        <Ligne a="Cabinet Lefèvre Avocats" b="FAC-2026-031" c={<Puce ton="vert">Payée</Puce>} d={`5 400,00${P}`} />
        <Ligne a="Atelier Morel" b="FAC-2026-030" c={<Puce ton="bleu">Transmise</Puce>} d={`2 160,00${P}`} />
        <Ligne a="Boulangerie Dupont" b="FAC-2026-029" c={<Puce ton="ambre">Relancée</Puce>} d={`1 200,00${P}`} />
        <Ligne a="Mairie de Villeurbanne" b="FAC-2026-028" c={<Puce ton="bleu">Chorus Pro</Puce>} d={`3 840,00${P}`} />
      </div>
    </>
  );
}

function Recues() {
  return (
    <>
      <Entete titre="Factures reçues" sous="Arrivées par la plateforme agréée" />
      <div className="mt-[1.2em] grid grid-cols-1 @[420px]:grid-cols-3 gap-[0.45em] @[420px]:gap-[0.6em]">
        <Tuile label="À payer" valeur={`682,80${P}`} />
        <Tuile label="En retard" valeur="0" />
        <Tuile label="À vérifier" valeur="1" ton="ambre" />
      </div>
      <div className="mt-[0.8em] grid gap-[0.45em]">
        <Ligne a="Hébergement Cloud FR" b="Échéance le 14/12" c={<Puce ton="ambre">À vérifier</Puce>} d={`106,80${P}`} />
        <Ligne a="Imprimerie Gutenberg" b="Échéance le 10/12" c={<Puce ton="bleu">Reçue</Puce>} d={`576,00${P}`} />
        <Ligne a="Assurance Pro Atlantique" b="Réglée le 05/11" c={<Puce ton="vert">Payée</Puce>} d={`234,00${P}`} />
        <Ligne a="Fournitures Léon" b="Montant contesté" c={<Puce ton="gris">Refusée</Puce>} d={`1 488,00${P}`} />
      </div>
    </>
  );
}

function Catalogue() {
  return (
    <>
      <Entete titre="Catalogue" sous="Tes prestations et tes prix" />
      <div className="mt-[1.2em] grid gap-[0.45em]">
        <Ligne a="Audit et arborescence" b="Utilisé dans 9 devis" c={<Puce ton="gris">Forfait</Puce>} d={`500,00${P}`} />
        <Ligne a="Maquette d'une page" b="Utilisé dans 14 devis" c={<Puce ton="gris">À la page</Puce>} d={`280,00${P}`} />
        <Ligne a="Intégration et adaptation mobile" b="Utilisé dans 8 devis" c={<Puce ton="gris">Forfait</Puce>} d={`1 800,00${P}`} />
        <Ligne a="Formulaire de contact et RGPD" b="Utilisé dans 6 devis" c={<Puce ton="gris">Forfait</Puce>} d={`800,00${P}`} />
      </div>
    </>
  );
}

const VUES: Record<CleEcran, () => React.ReactElement> = { tableau: Tableau, factures: Factures, recues: Recues, catalogue: Catalogue };

export function EcranApp({ cle }: { cle: CleEcran }) {
  const Vue = VUES[cle];
  return (
    <div className="@container w-full h-full">
      <div data-ui className="h-full text-[max(15px,2.05cqw)] leading-snug p-[1.4em]">
        <Vue />
      </div>
    </div>
  );
}
