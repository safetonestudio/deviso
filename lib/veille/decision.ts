/**
 * Veille quotidienne : décider s'il faut écrire, et quoi (20/11/2026).
 *
 * Fonction pure, sans base ni réseau : c'est elle qui garantit « une seule
 * alerte par panne ». Règle :
 *
 *  - un contrôle qui passe au rouge déclenche une alerte (une seule, qui liste
 *    aussi les pannes encore en cours, pour que le message se suffise) ;
 *  - tant que l'ensemble des contrôles en panne ne change pas, rien ne part,
 *    même si le détail du message d'erreur varie d'un jour à l'autre ;
 *  - quand un contrôle redevient vert, un message le dit : « retour à la
 *    normale » si plus rien n'est en panne, sinon « amélioration » (ce qui est
 *    réparé, et ce qui reste) ;
 *  - tout va bien et allait bien : silence.
 */

export type Panne = { libelle: string; detail: string; depuis: string };
export type Pannes = Record<string, Panne>;

/** Résultat d'un contrôle. `ok: false` = panne. */
export type Resultat = { id: string; libelle: string; ok: boolean; detail?: string };

export type Alerte = {
  genre: "panne" | "amelioration" | "retour";
  sujet: string;
  texte: string;
  html: string;
  nouvelles: string[];
  reparees: string[];
  enCours: string[];
};

export function decider(
  precedentes: Pannes,
  resultats: Resultat[],
  maintenant: Date,
): { pannes: Pannes; alerte: Alerte | null } {
  const pannes: Pannes = {};
  for (const r of resultats) {
    if (r.ok) continue;
    pannes[r.id] = {
      libelle: r.libelle,
      detail: (r.detail ?? "").slice(0, 600),
      // Une panne déjà connue garde sa date de début.
      depuis: precedentes[r.id]?.depuis ?? maintenant.toISOString(),
    };
  }
  const nouvelles = Object.keys(pannes).filter((id) => !(id in precedentes));
  const reparees = Object.keys(precedentes).filter((id) => !(id in pannes));
  if (nouvelles.length === 0 && reparees.length === 0) return { pannes, alerte: null };

  const enCours = Object.keys(pannes).filter((id) => !nouvelles.includes(id));
  const genre: Alerte["genre"] = nouvelles.length > 0 ? "panne" : Object.keys(pannes).length === 0 ? "retour" : "amelioration";
  const nb = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
  const sujet =
    genre === "panne"
      ? `Veille Deviso · ${nb(nouvelles.length, "chemin")} en panne`
      : genre === "retour"
        ? "Veille Deviso · retour à la normale"
        : `Veille Deviso · ${nb(reparees.length, "chemin")} réparé${reparees.length > 1 ? "s" : ""}, ${nb(Object.keys(pannes).length, "panne")} en cours`;

  const jour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const lignes: { titre: string; items: string[] }[] = [];
  if (nouvelles.length) lignes.push({ titre: "Nouvelle panne", items: nouvelles.map((id) => `${pannes[id].libelle} : ${pannes[id].detail || "sans détail"}`) });
  if (enCours.length) lignes.push({ titre: "Toujours en panne (déjà signalé)", items: enCours.map((id) => `${pannes[id].libelle}, depuis le ${jour(pannes[id].depuis)}`) });
  if (reparees.length) lignes.push({ titre: "Revenu à la normale", items: reparees.map((id) => `${precedentes[id].libelle} (en panne depuis le ${jour(precedentes[id].depuis)})`) });

  const pied =
    genre === "retour"
      ? "Tous les contrôles de la veille passent. Plus aucun message tant que rien ne casse."
      : "Ce message ne sera pas répété : la veille se tait tant que la même panne dure, et écrira quand elle sera réparée.";
  const texte = [
    ...lignes.flatMap((b) => [b.titre, ...b.items.map((i) => `- ${i}`), ""]),
    pied,
  ].join("\n");
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${esc(sujet)}</title></head>
<body style="margin:0;padding:24px;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#16211c;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;">
<p style="margin:0 0 16px;font-size:18px;font-weight:700;">${esc(sujet)}</p>
${lignes
  .map(
    (b) => `<p style="margin:16px 0 6px;font-size:14px;font-weight:700;">${esc(b.titre)}</p>
<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`,
  )
  .join("\n")}
<p style="margin:20px 0 0;font-size:13px;color:#5b665f;">${esc(pied)}</p>
</div></body></html>`;

  return { pannes, alerte: { genre, sujet, texte, html, nouvelles, reparees, enCours } };
}
