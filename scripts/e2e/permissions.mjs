/**
 * Autorisations des membres d'équipe — le comportement, pas seulement le code.
 *
 * Modèle (CLAUDE.md, « Membres d'équipe ») : cinq actes réglables par le gérant
 * (envoyer devis, envoyer facture, transmettre PA, déposer Chorus, refuser une
 * facture reçue), tout le reste titulaire seul. Défaut à l'invitation : rien.
 *
 * Ce test crée un vrai propriétaire et un vrai membre, les rattache par le
 * tunnel d'invitation, et vérifie que chaque garde répond juste : refus tant
 * que le gérant n'a pas coché, accès dès qu'il coche, et jamais d'accès aux
 * actes titulaire-seul quoi qu'il coche.
 *
 * Les gardes d'acte sont posées AVANT toute logique métier (précontrôle PA,
 * dépôt Chorus…), donc un 403 « PERMISSION_REFUSEE » se teste sans raccordement
 * réel : c'est la garde qu'on mesure, pas la plateforme.
 *
 * Usage : node scripts/e2e/permissions.mjs
 */

import { openSession, linkAsTeamMember, verifier, bilan } from "./lib.mjs";

const doc = (o) => JSON.stringify(o);
const TOUS_FAUX = {
  envoyer_devis: false, envoyer_facture: false, transmettre_pa: false,
  deposer_chorus: false, refuser_facture_recue: false,
};

console.log("── Mise en place ─────────────────────────────────────────────");
const owner = await openSession("propriétaire");
const member = await openSession("membre");
await linkAsTeamMember(owner, member);

// Retrouver la ligne du membre pour régler ses droits.
const equipe = await owner.call("/api/team");
const ligne = (equipe.body?.members ?? []).find((m) => m.member_id === member.userId && m.status === "active");
verifier("le membre est rattaché et visible côté équipe", Boolean(ligne?.id), `id ${ligne?.id}`);
if (!ligne?.id) process.exit(bilan());
const memberId = ligne.id;

const reglerDroits = (permissions) =>
  owner.call(`/api/team/${memberId}`, { method: "PATCH", body: doc({ permissions }) });

// Documents créés par le propriétaire, sur lesquels le membre agira.
const mkFacture = async () => {
  const f = await owner.call("/api/invoices", {
    method: "POST",
    body: doc({
      client_name: "Client Droits", client_email: "droits@example.fr", client_company: "Droits SARL",
      client_street: "3 rue des Tests", client_postcode: "33000", client_city: "Bordeaux", client_siren: "552100554",
      seller_company: "Studio Témoin", seller_siren: "103340857",
      seller_street: "1 rue Vendeur", seller_postcode: "33170", seller_city: "Gradignan",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
      total_ht: 1000, tva_rate: 0, total_ttc: 1000,
      issue_date: "2026-08-12", due_date: "2026-09-11",
      operation_category: "services", type_code: "380", invoice_type: "standard",
    }),
  });
  return f.body?.invoice?.id;
};
const mkDevis = async () => {
  const d = await owner.call("/api/proposals", {
    method: "POST",
    body: doc({
      title: "Devis Droits", client_name: "Client Droits", client_email: "droits@example.fr",
      client_company: "Droits SARL", client_street: "3 rue des Tests", client_postcode: "33000",
      client_city: "Bordeaux", client_siren: "552100554",
      items: [{ description: "Prestation", quantity: 1, unit: "forfait", unit_price: 1000, total: 1000 }],
      total_ht: 1000, tva_rate: 0, total_ttc: 1000, valid_until: "2026-12-31", payment_terms: "30 jours net",
    }),
  });
  return d.body?.proposal?.id;
};

const estRefuseActe = (r) => r.status === 403 && r.body?.error === "PERMISSION_REFUSEE";
const estRefuseTitulaire = (r) => r.status === 403 && r.body?.error === "RESERVE_TITULAIRE";

console.log("");
console.log("── Défaut à l'invitation : le membre ne peut rien envoyer ────");
await reglerDroits(TOUS_FAUX);
{
  const facture = await mkFacture();
  const devis = await mkDevis();

  const envF = await member.call(`/api/invoices/${facture}`, { method: "PATCH", body: doc({ status: "sent" }) });
  verifier("envoyer une facture est refusé (envoyer_facture décoché)", estRefuseActe(envF), `HTTP ${envF.status} ${doc(envF.body).slice(0,90)}`);

  const envD = await member.call(`/api/proposals/${devis}`, { method: "PATCH", body: doc({ status: "sent" }) });
  verifier("envoyer un devis est refusé (envoyer_devis décoché)", estRefuseActe(envD), `HTTP ${envD.status} ${doc(envD.body).slice(0,90)}`);

  const pa = await member.call(`/api/superpdp/invoices/${facture}/emettre`, { method: "POST" });
  verifier("transmettre à la PA est refusé (transmettre_pa décoché)", estRefuseActe(pa), `HTTP ${pa.status} ${doc(pa.body).slice(0,90)}`);

  const ch = await member.call(`/api/invoices/${facture}/chorus-pro`, { method: "POST" });
  verifier("déposer sur Chorus est refusé (deposer_chorus décoché)", estRefuseActe(ch), `HTTP ${ch.status} ${doc(ch.body).slice(0,90)}`);

  const rf = await member.call(`/api/superpdp/invoices/999999/refuser`, { method: "POST", body: doc({ motif: "TEST" }) });
  verifier("refuser une facture reçue est refusé (décoché)", estRefuseActe(rf), `HTTP ${rf.status} ${doc(rf.body).slice(0,90)}`);
}

console.log("");
console.log("── Actes titulaire seul : refusés au membre quoi qu'il arrive ─");
{
  const facture = await mkFacture();
  const paie = await member.call(`/api/invoices/${facture}`, { method: "PATCH", body: doc({ status: "paid" }) });
  verifier("marquer payée est réservé au titulaire", estRefuseTitulaire(paie), `HTTP ${paie.status} ${doc(paie.body).slice(0,90)}`);

  const del = await member.call(`/api/invoices/${facture}`, { method: "DELETE" });
  verifier("supprimer une facture est réservé au titulaire", estRefuseTitulaire(del), `HTTP ${del.status} ${doc(del.body).slice(0,90)}`);

  const fec = await member.call(`/api/export/fec?year=2026`);
  verifier("l'export FEC est réservé au titulaire", fec.status === 403, `HTTP ${fec.status}`);

  const crm = await member.call(`/api/crm`);
  verifier("le CRM complet est réservé au titulaire", crm.status === 403, `HTTP ${crm.status}`);

  const stats = await member.call(`/api/stats`);
  verifier("les statistiques sont réservées au titulaire", stats.status === 403, `HTTP ${stats.status}`);
}

console.log("");
console.log("── Le gérant coche : la fonction s'ouvre, uniquement celle-là ─");
await reglerDroits({ ...TOUS_FAUX, envoyer_devis: true, envoyer_facture: true });
{
  const facture = await mkFacture();
  const devis = await mkDevis();

  const envF = await member.call(`/api/invoices/${facture}`, { method: "PATCH", body: doc({ status: "sent" }) });
  verifier("envoyer une facture aboutit une fois coché", envF.status === 200 && envF.body?.invoice?.status === "sent", `HTTP ${envF.status} ${doc(envF.body).slice(0,90)}`);

  const envD = await member.call(`/api/proposals/${devis}`, { method: "PATCH", body: doc({ status: "sent" }) });
  verifier("envoyer un devis aboutit une fois coché", envD.status === 200 && envD.body?.proposal?.status === "sent", `HTTP ${envD.status} ${doc(envD.body).slice(0,90)}`);

  // Mais les actes NON cochés restent fermés.
  const pa = await member.call(`/api/superpdp/invoices/${facture}/emettre`, { method: "POST" });
  verifier("transmettre à la PA reste refusé (non coché)", estRefuseActe(pa), `HTTP ${pa.status} ${doc(pa.body).slice(0,90)}`);
}

console.log("");
console.log("── Tout coché : la garde d'acte laisse passer (PA/Chorus) ────");
await reglerDroits({ envoyer_devis: true, envoyer_facture: true, transmettre_pa: true, deposer_chorus: true, refuser_facture_recue: true });
{
  const facture = await mkFacture();
  const pa = await member.call(`/api/superpdp/invoices/${facture}/emettre`, { method: "POST" });
  verifier("transmettre à la PA n'est plus refusé pour permission (garde franchie)", !estRefuseActe(pa), `HTTP ${pa.status} ${doc(pa.body).slice(0,120)}`);

  const ch = await member.call(`/api/invoices/${facture}/chorus-pro`, { method: "POST" });
  verifier("déposer sur Chorus n'est plus refusé pour permission (garde franchie)", !estRefuseActe(ch), `HTTP ${ch.status} ${doc(ch.body).slice(0,120)}`);

  // Et le titulaire-seul, lui, reste fermé même tout coché.
  const paie = await member.call(`/api/invoices/${facture}`, { method: "PATCH", body: doc({ status: "paid" }) });
  verifier("marquer payée reste titulaire seul, même tout coché", estRefuseTitulaire(paie), `HTTP ${paie.status} ${doc(paie.body).slice(0,90)}`);
}

console.log("");
console.log("── Le titulaire, lui, peut tout ──────────────────────────────");
{
  const facture = await mkFacture();
  const envF = await owner.call(`/api/invoices/${facture}`, { method: "PATCH", body: doc({ status: "sent" }) });
  verifier("le titulaire envoie une facture", envF.status === 200, `HTTP ${envF.status}`);
  const fec = await owner.call(`/api/export/fec?year=2026`);
  verifier("le titulaire exporte le FEC", fec.status === 200, `HTTP ${fec.status}`);
}

// Remettre le membre à l'état neutre pour ne pas polluer d'autres exécutions.
await reglerDroits(TOUS_FAUX);

process.exit(bilan());
