import type { createAdminClient } from "@/lib/supabase/admin";
import { dossiersDuCabinet } from "@/lib/cabinet-acces";
import { syntheseDossiers, lireFacturesDossiers } from "@/lib/cabinet-dossiers";
import { calendrierTva } from "@/lib/cabinet-tva-calendrier";
import { appUrl } from "@/lib/public-url";
import { echapperHtml } from "@/lib/emails/html";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Résumé du lundi envoyé au cabinet (20/11/2026).
 *
 * L'étude de marché l'a montré : un cabinet n'ouvre pas un tableau de bord de
 * plus, il faut lui apporter l'information. Le résumé reprend exactement ce
 * que montre l'accueil de l'espace cabinet (mêmes fonctions de calcul) : les
 * dossiers qui demandent une action ou une surveillance, et la TVA à déclarer
 * sur la période close. Rien à signaler : pas de courriel.
 *
 * Les dossiers de démonstration sont exclus : le cabinet de démonstration est
 * rattaché à des comptes factices, et un vrai cabinet ne doit jamais voir de
 * données inventées dans sa boîte.
 */
export type Resume = { sujet: string; html: string; texte: string; nbATraiter: number; nbTva: number };

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const pl = (n: number, mot: string, motPluriel = `${mot}s`) => `${n} ${n > 1 ? motPluriel : mot}`;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export async function construireResume(
  admin: Admin,
  cabinetId: string,
  reference: Date = new Date(),
  /** Rythme choisi par le cabinet, en clair (« chaque lundi »), cité dans le pied du courriel. */
  rythme = "chaque lundi",
  /** Veille quotidienne seulement : construire le résumé d'un cabinet de démonstration, sans l'envoyer. */
  options: { inclureDemo?: boolean } = {},
): Promise<Resume | null> {
  const tous = await dossiersDuCabinet(admin, cabinetId);
  if (tous.length === 0) return null;
  const { data: demos } = await admin.from("profiles").select("id").in("id", tous).eq("is_demo", true);
  const exclus = new Set(options.inclureDemo ? [] : (demos ?? []).map((d) => d.id as string));
  const ownerIds = tous.filter((id) => !exclus.has(id));
  if (ownerIds.length === 0) return null;

  const dossiers = await syntheseDossiers(admin, ownerIds, reference);
  const factures = await lireFacturesDossiers(admin, ownerIds, `${reference.getFullYear() - 1}-01-01`);
  const calendrier = calendrierTva(dossiers, factures, reference);

  const aTraiter = dossiers.filter((d) => d.niveau !== "vert");
  const tva = calendrier
    .filter((l) => l.aDeclarer && l.aDeclarer.tva > 0)
    .sort((a, b) => (b.aDeclarer?.tva ?? 0) - (a.aDeclarer?.tva ?? 0));
  if (aTraiter.length === 0 && tva.length === 0) return null;

  const base = appUrl();
  const rouges = aTraiter.filter((d) => d.niveau === "rouge").length;
  const sujet =
    aTraiter.length > 0
      ? `Votre portefeuille Deviso · ${pl(aTraiter.length, "dossier")} à traiter`
      : `Votre portefeuille Deviso · TVA à déclarer pour ${pl(tva.length, "dossier")}`;

  const ligneDossier = (d: (typeof aTraiter)[number]) => {
    const autres = d.anomalies.length > 1 ? ` (et ${pl(d.anomalies.length - 1, "autre point", "autres points")})` : "";
    const couleur = d.niveau === "rouge" ? "#b93a2e" : "#b15a2b";
    const etat = d.niveau === "rouge" ? "Action requise" : "À surveiller";
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #e1e4db;">
      <a href="${base}/cabinet/${d.id}" style="font-size:15px;font-weight:600;color:#16211c;text-decoration:none;">${echapperHtml(d.nom)}</a>
      <span style="font-size:12px;font-weight:600;color:${couleur};padding-left:8px;">${etat}</span>
      <div style="font-size:14px;color:#5b665f;padding-top:2px;">${echapperHtml(d.anomalies[0]?.libelle ?? "")}${echapperHtml(autres)}</div>
    </td></tr>`;
  };
  const ligneTva = (l: (typeof tva)[number]) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #e1e4db;font-size:15px;color:#16211c;">
        <a href="${base}/cabinet/${l.id}#tva" style="color:#16211c;text-decoration:none;font-weight:600;">${echapperHtml(l.nom)}</a>
        <div style="font-size:13px;color:#5b665f;">${echapperHtml(cap(l.aDeclarer?.libelle ?? ""))}</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e1e4db;font-size:15px;font-weight:600;color:#16211c;text-align:right;white-space:nowrap;">${eur(l.aDeclarer?.tva ?? 0)}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${echapperHtml(sujet)}</title></head>
<body style="margin:0;padding:0;background:#edefe9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#edefe9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding-bottom:20px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#0f7a55;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;"><span style="color:#fff;font-weight:700;font-size:16px;">D</span></td>
            <td style="padding-left:10px;font-size:18px;font-weight:700;color:#16211c;">Deviso</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #e1e4db;padding:32px;">
          <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#16211c;">Votre portefeuille cette semaine</p>
          <p style="margin:0 0 24px;font-size:15px;color:#5b665f;line-height:1.6;">
            ${rouges ? `${pl(rouges, "dossier demande", "dossiers demandent")} une action. ` : ""}${aTraiter.length - rouges ? `${pl(aTraiter.length - rouges, "dossier")} à surveiller. ` : ""}${tva.length ? `TVA à déclarer sur la période close : ${eur(tva.reduce((s, l) => s + (l.aDeclarer?.tva ?? 0), 0))}.` : ""}
          </p>
          ${aTraiter.length ? `<p style="margin:0;font-size:13px;font-weight:700;color:#16211c;">Dossiers à traiter</p><table width="100%" cellpadding="0" cellspacing="0">${aTraiter.slice(0, 10).map(ligneDossier).join("")}</table>` : ""}
          ${tva.length ? `<p style="margin:24px 0 0;font-size:13px;font-weight:700;color:#16211c;">TVA à déclarer</p><table width="100%" cellpadding="0" cellspacing="0">${tva.slice(0, 10).map(ligneTva).join("")}</table>` : ""}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td align="center">
            <a href="${base}/cabinet" style="display:inline-block;background:#0f7a55;color:#fff;font-weight:600;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:10px;">Ouvrir mon espace cabinet</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding-top:16px;font-size:12px;color:#5b665f;line-height:1.6;text-align:center;">
          Vous recevez ce résumé ${echapperHtml(rythme)} parce que des clients vous ont donné accès à leur dossier Deviso, en lecture seule.
          Pour changer son rythme ou ne plus le recevoir : <a href="${base}/cabinet/parametres?vue=notifications" style="color:#0f7a55;">Paramètres de votre espace cabinet</a>, rubrique Notifications.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const texte = [
    "Votre portefeuille Deviso",
    "",
    ...aTraiter.slice(0, 10).map((d) => `- ${d.nom} (${d.niveau === "rouge" ? "action requise" : "à surveiller"}) : ${d.anomalies[0]?.libelle ?? ""}`),
    ...(tva.length ? ["", "TVA à déclarer :", ...tva.slice(0, 10).map((l) => `- ${l.nom}, ${cap(l.aDeclarer?.libelle ?? "")} : ${eur(l.aDeclarer?.tva ?? 0)}`)] : []),
    "",
    `Ouvrir mon espace cabinet : ${base}/cabinet`,
    "",
    `Vous recevez ce résumé ${rythme}. Pour changer son rythme ou ne plus le recevoir : ${base}/cabinet/parametres?vue=notifications`,
  ].join("\n");

  return { sujet, html, texte, nbATraiter: aTraiter.length, nbTva: tva.length };
}

/**
 * Adresses qui ne reçoivent jamais de courriel : domaines réservés aux tests
 * (cabinet de démonstration). Un envoi y rebondirait et dégraderait la
 * réputation d'envoi du domaine.
 */
export function adresseDeTest(email: string | null | undefined): boolean {
  const e = (email ?? "").toLowerCase();
  return !e || /@(example\.(com|org|net)|demo\.getdeviso\.fr)$/.test(e) || e.endsWith(".internal") || e.endsWith(".test");
}
