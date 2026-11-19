import type { ReactNode } from "react";

/**
 * Écrans du cockpit cabinet pour la page experts-comptables, composés en HTML
 * (données d'exemple) avec les couleurs de l'app. Même portefeuille de cinq
 * dossiers que l'aperçu du haut de page. Nous sommes en novembre : les
 * dossiers mensuels ont octobre clos, les trimestriels le 3ᵉ trimestre.
 *
 * Mesures en em ; la taille de base suit la largeur du cadre.
 */
const E = " €";

type Ton = "vert" | "ambre" | "bleu" | "gris";
const TON: Record<Ton, string> = {
  vert: "bg-indigo-500/15 text-indigo-300",
  ambre: "bg-amber-500/15 text-amber-300",
  bleu: "bg-blue-500/15 text-blue-300",
  gris: "bg-ink/10 text-gray-300",
};

function Puce({ ton, children }: { ton: Ton; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-[0.7em] py-[0.15em] text-[0.8em] font-semibold whitespace-nowrap ${TON[ton]}`}>{children}</span>;
}

function Cadre({ titre, sous, badge, children }: { titre: string; sous: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="@container w-full h-full">
      <div data-ui className="h-full text-[max(15px,1.95cqw)] leading-snug p-[1.4em]">
        <div className="flex items-start justify-between gap-[1em]">
          <div className="min-w-0">
            <div className="text-[1.5em] leading-tight font-semibold tracking-[-0.02em] text-ink">{titre}</div>
            <div className="mt-[0.2em] text-gray-400">{sous}</div>
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        <div className="mt-[1.2em]">{children}</div>
      </div>
    </div>
  );
}

const Ligne = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[0.6em] bg-ds-elevated px-[0.9em] py-[0.7em] ${className}`}>{children}</div>
);

export function EcranConformite() {
  const lignes: [string, Ton, string, Ton, string, Ton, string][] = [
    ["Studio Durand", "vert", "Raccordé", "vert", "Joignable", "vert", "Valide"],
    ["Boulangerie Dupont", "vert", "Raccordé", "vert", "Joignable", "ambre", "À vérifier"],
    ["Atelier Morel", "vert", "Raccordé", "vert", "Joignable", "vert", "Valide"],
    ["Garage Petit", "ambre", "Non raccordé", "ambre", "Introuvable", "vert", "Valide"],
    ["Cabinet Lefèvre", "vert", "Raccordé", "vert", "Joignable", "vert", "Valide"],
  ];
  return (
    <Cadre titre="Conformité" sous="Qui peut émettre et recevoir des factures conformes" badge={<Puce ton="ambre">2 à régulariser</Puce>}>
      <div className="hidden @[480px]:grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-[0.8em] px-[0.9em] pb-[0.4em] text-[0.85em] text-gray-500">
        <span>Dossier</span><span>Plateforme</span><span>Annuaire</span><span>SIRET</span>
      </div>
      <div className="grid gap-[0.4em]">
        {[lignes[3], lignes[1], lignes[0], lignes[2], lignes[4]].map(([nom, t1, v1, t2, v2, t3, v3]) => (
          <Ligne key={nom} className="grid grid-cols-1 @[480px]:grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-x-[0.8em] gap-y-[0.35em]">
            <span className="font-medium text-ink truncate">{nom}</span>
            {([["Plateforme", t1, v1], ["Annuaire", t2, v2], ["SIRET", t3, v3]] as [string, Ton, string][]).map(([etiquette, ton, valeur]) => (
              <span key={etiquette} className="flex items-center justify-between gap-[0.8em] @[480px]:block">
                <span className="text-[0.85em] text-gray-500 @[480px]:hidden">{etiquette}</span>
                <Puce ton={ton}>{valeur}</Puce>
              </span>
            ))}
          </Ligne>
        ))}
      </div>
    </Cadre>
  );
}

export function EcranTva() {
  const lignes: [string, string, string, string, string][] = [
    ["Cabinet Lefèvre", "Mensuelle", "Octobre", `1 900${E}`, `2 300${E}`],
    ["Studio Durand", "Mensuelle", "Octobre", `980${E}`, `1 120${E}`],
    ["Atelier Morel", "Trimestrielle", "3ᵉ trimestre", `2 140${E}`, `1 460${E}`],
    ["Garage Petit", "Mensuelle", "Octobre", `640${E}`, `410${E}`],
  ];
  return (
    <Cadre titre="Calendrier de TVA" sous="Période close prête à déclarer, période en cours" badge={<Puce ton="ambre">4 à déclarer</Puce>}>
      <div className="grid gap-[0.4em]">
        {lignes.map(([nom, rythme, close, montantClos, enCours]) => (
          <Ligne key={nom} className="flex flex-wrap items-center justify-between gap-x-[1em] gap-y-[0.3em]">
            <span className="min-w-0">
              <span className="block font-medium text-ink">{nom}</span>
              <span className="block text-[0.85em] text-gray-400">{rythme}</span>
            </span>
            <span className="flex items-center gap-[0.8em] tabular-nums">
              <span className="text-right">
                <span className="block text-[0.8em] text-amber-300">{close}, prête</span>
                <span className="block font-semibold text-ink">{montantClos}</span>
              </span>
              <span className="text-right">
                <span className="block text-[0.8em] text-gray-500">En cours</span>
                <span className="block text-gray-300">{enCours}</span>
              </span>
            </span>
          </Ligne>
        ))}
        <Ligne className="flex items-center justify-between">
          <span className="font-medium text-ink">Boulangerie Dupont</span>
          <Puce ton="gris">Franchise, non concernée</Puce>
        </Ligne>
      </div>
    </Cadre>
  );
}

export function EcranATraiter() {
  const items: [Ton, string, string, string][] = [
    ["ambre", "Facture rejetée par la plateforme", "Garage Petit", "FAC-2026-014, SIRET du client invalide"],
    ["ambre", "Impayé échu depuis 32 jours", "Atelier Morel", `FAC-2026-030, 2 160${E}`],
    ["bleu", "Trou de numérotation", "Boulangerie Dupont", "FAC-2026-008 absente de la suite"],
    ["bleu", "SIREN client manquant", "Studio Durand", "1 facture à compléter"],
  ];
  return (
    <Cadre titre="À traiter" sous="Les anomalies de tout le portefeuille, par urgence" badge={<Puce ton="ambre">4 anomalies</Puce>}>
      <div className="grid gap-[0.4em]">
        {items.map(([ton, quoi, qui, detail], k) => (
          <Ligne key={quoi} className="flex items-start gap-[0.8em]">
            <span className={`mt-[0.35em] w-[0.55em] h-[0.55em] rounded-full shrink-0 ${ton === "ambre" ? "bg-amber-400" : "bg-blue-400"}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{quoi}</span>
              <span className="block text-[0.9em] text-gray-400">{qui}, {detail}</span>
            </span>
            <span className="shrink-0"><Puce ton={k < 2 ? "ambre" : "gris"}>{k < 2 ? "Urgent" : "À voir"}</Puce></span>
          </Ligne>
        ))}
      </div>
    </Cadre>
  );
}

export function EcranExports() {
  return (
    <Cadre titre="Exports comptables" sous="Exercice 2026">
      <div className="inline-flex flex-wrap gap-[0.3em] rounded-[0.6em] bg-ds-elevated p-[0.3em]">
        {["Un client", "Une sélection", "Tout le portefeuille"].map((c, i) => (
          <span key={c} className={`rounded-[0.45em] px-[0.8em] py-[0.35em] text-[0.9em] font-medium ${i === 2 ? "bg-ink/15 text-ink" : "text-gray-400"}`}>{c}</span>
        ))}
      </div>
      <div className="mt-[0.9em] grid gap-[0.4em]">
        {[
          ["Fichier des écritures comptables (FEC)", "Format officiel, un fichier par dossier"],
          ["Factures au format CSV", "Ventes de l'exercice, toutes colonnes"],
          ["Livre des recettes", "Pour les dossiers en micro-entreprise"],
        ].map(([t, d]) => (
          <Ligne key={t} className="flex items-center justify-between gap-[1em]">
            <span className="min-w-0">
              <span className="block font-medium text-ink">{t}</span>
              <span className="block text-[0.85em] text-gray-400">{d}</span>
            </span>
            <Puce ton="vert">Inclus</Puce>
          </Ligne>
        ))}
      </div>
      <div className="mt-[0.9em] flex items-center justify-between gap-[1em] rounded-[0.6em] bg-indigo-500/10 px-[0.9em] py-[0.8em]">
        <span className="text-ink">Archive du portefeuille, 5 dossiers</span>
        <span className="rounded-[0.5em] bg-indigo-600 px-[0.9em] py-[0.4em] text-[0.9em] font-semibold text-on-accent whitespace-nowrap">Télécharger</span>
      </div>
    </Cadre>
  );
}

export function EcranJournal() {
  const entrees: [string, string, string][] = [
    ["Aujourd'hui, 9 h 42", "Export FEC", "Studio Durand"],
    ["Aujourd'hui, 9 h 30", "Consultation du dossier", "Atelier Morel"],
    ["Hier, 17 h 05", "Export du livre des recettes", "Boulangerie Dupont"],
  ];
  return (
    <Cadre titre="Journal et signalements" sous="Tracé pour vous seul">
      <div className="grid gap-[0.4em]">
        {entrees.map(([quand, quoi, qui]) => (
          <Ligne key={quand} className="flex items-center justify-between gap-[1em]">
            <span className="min-w-0">
              <span className="block text-ink">{quoi}</span>
              <span className="block text-[0.85em] text-gray-400">{qui}</span>
            </span>
            <span className="text-[0.85em] text-gray-500 whitespace-nowrap">{quand}</span>
          </Ligne>
        ))}
      </div>
      <div className="mt-[0.9em] rounded-[0.6em] bg-blue-500/10 px-[0.9em] py-[0.8em]">
        <div className="flex items-center justify-between gap-[1em]">
          <span className="text-[0.85em] text-blue-300">Signalement envoyé à Boulangerie Dupont</span>
          <Puce ton="vert">Affiché chez le client</Puce>
        </div>
        <div className="mt-[0.3em] text-ink">« La facture FAC-2026-008 manque dans la numérotation. Pouvez-vous vérifier&nbsp;? »</div>
      </div>
    </Cadre>
  );
}

export function EcranLectureSeule() {
  return (
    <Cadre titre="Studio Durand" sous="Dossier client" badge={<Puce ton="bleu">Lecture seule</Puce>}>
      <div className="grid grid-cols-2 gap-[0.5em]">
        <Ligne>
          <span className="block text-[0.85em] text-gray-400">Encaissé 2026, HT</span>
          <span className="block text-[1.3em] font-semibold tabular-nums text-ink">64 300{E}</span>
        </Ligne>
        <Ligne>
          <span className="block text-[0.85em] text-gray-400">Factures émises</span>
          <span className="block text-[1.3em] font-semibold tabular-nums text-ink">31</span>
        </Ligne>
      </div>
      <div className="mt-[0.5em] grid gap-[0.4em]">
        {[["FAC-2026-031", "Cabinet Lefèvre Avocats", `5 400,00${E}`], ["FAC-2026-030", "Atelier Morel", `2 160,00${E}`]].map(([n, c, m]) => (
          <Ligne key={n} className="flex items-center justify-between gap-[1em]">
            <span className="min-w-0"><span className="block text-ink truncate">{c}</span><span className="block text-[0.85em] text-gray-400">{n}</span></span>
            <span className="font-semibold tabular-nums text-ink whitespace-nowrap">{m}</span>
          </Ligne>
        ))}
      </div>
      <div className="mt-[0.9em] flex flex-wrap gap-[0.4em]" aria-hidden="true">
        {["Modifier", "Envoyer", "Supprimer"].map((b) => (
          <span key={b} className="rounded-[0.5em] border border-ink/10 px-[0.8em] py-[0.35em] text-[0.9em] text-gray-500 line-through decoration-gray-600">{b}</span>
        ))}
      </div>
      <div className="mt-[0.5em] text-[0.85em] text-gray-400">Votre client garde la main sur sa facturation.</div>
    </Cadre>
  );
}
