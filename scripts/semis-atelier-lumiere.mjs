/**
 * Jeu de donnees du compte de test du bac a sable (23/11/2026).
 *
 * « Atelier Lumière », photographe-videaste, EI au reel assujettie a la TVA,
 * rattache au cabinet de demonstration (team_members, role comptable). Sert a
 * juger l'interface, rien d'autre. Avant ce script, ses donnees etaient une
 * annee d'activite factice semee a la main, plus les restes de dizaines de
 * passages de tests (factures « REFUS-E2E », brouillons, transmissions au bac
 * a sable) : aucune ligne ne portait sa nature (bien / prestation).
 *
 * Ce que fait le script, et rien d'autre :
 *   - verifie l'identite du compte (identifiant, adresse, raison sociale) et
 *     refuse tout autre compte ;
 *   - efface SES factures, devis, offres du catalogue, factures recurrentes et
 *     compteurs de numerotation (en base seulement : AUCUN appel a la
 *     Plateforme Agreee, les factures deja transmises au bac a sable n'ont
 *     aucune portee fiscale) ;
 *   - ne touche PAS : profil, raccordement Super PDP, factures recues, achats a
 *     l'etranger, contacts, rattachement au cabinet ;
 *   - resseme un catalogue de 12 offres avec leur nature (dont deux ventes de
 *     biens : tirages d'art et album), une annee de factures (novembre 2025 a
 *     aujourd'hui, environ trois par mois, prestations, biens et mixtes), six
 *     devis, et remet les compteurs au niveau de ce qui est ecrit.
 *
 * La nature de chaque facture est DEDUITE de ses lignes par la regle unique de
 * l'application (lib/nature-operation.ts), et ses totaux viennent de
 * lib/tva.ts : memes calculs que la route de creation.
 *
 * Usage : node scripts/semis-atelier-lumiere.mjs [--essai]   (lit .env.local ;
 *         --essai calcule et affiche sans rien ecrire)
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { secret } from "./e2e/lib.mjs";
import { deduireCategorie } from "../lib/nature-operation.ts";
import { ventilationTva } from "../lib/tva.ts";

const COMPTE = {
  id: "ac3abc18-d1ee-4b21-b0ec-bf6f17767e31",
  email: "superpdp-test@getdeviso.fr",
  company_name: "Atelier Lumière",
};
// Compte reel de Selim : jamais, quoi qu'il arrive.
const INTERDITS = new Set(["767be0c3-6978-4a43-a15f-454fa38146e3"]);

const admin = createClient(secret("NEXT_PUBLIC_SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

// -- Garde d'identite -----------------------------------------------------------
if (INTERDITS.has(COMPTE.id)) throw new Error("compte interdit");
const { data: u, error: eU } = await admin.auth.admin.getUserById(COMPTE.id);
if (eU || !u?.user) throw new Error(`compte introuvable : ${eU?.message}`);
const { data: profil } = await admin
  .from("profiles")
  .select("id, company_name, full_name, siret, address_street, address_postcode, address_city, tva_number, tva_regime")
  .eq("id", COMPTE.id)
  .single();
if (u.user.email !== COMPTE.email || profil?.company_name !== COMPTE.company_name) {
  throw new Error(`identite inattendue (${u.user.email} / ${profil?.company_name}) : abandon, rien n'a ete efface.`);
}

const r2 = (n) => Math.round(n * 100) / 100;
const iso = (d) => d.toISOString().slice(0, 10);
const plusJours = (s, n) => iso(new Date(new Date(`${s}T12:00:00Z`).getTime() + n * 86_400_000));
const AUJOURDHUI = iso(new Date());

// -- Catalogue ----------------------------------------------------------------------
const CATALOGUE = [
  { name: "Reportage mariage - journée complète", unit: "forfait", unit_price: 1800, nature: "services" },
  { name: "Captation vidéo - journée", unit: "forfait", unit_price: 1200, nature: "services" },
  { name: "Captation vidéo événement - demi-journée", unit: "forfait", unit_price: 650, nature: "services" },
  { name: "Photo culinaire - menu restaurant", unit: "forfait", unit_price: 520, nature: "services" },
  { name: "Photographie de produit - lot 20 visuels", unit: "forfait", unit_price: 480, nature: "services" },
  { name: "Montage vidéo - jusqu'à 3 min", unit: "forfait", unit_price: 450, nature: "services" },
  { name: "Prise de vue drone", unit: "forfait", unit_price: 400, nature: "services" },
  { name: "Shooting immobilier / architecture", unit: "forfait", unit_price: 350, nature: "services" },
  { name: "Shooting portrait corporate", unit: "heure", unit_price: 250, nature: "services", type: "hourly" },
  { name: "Retouche photo - lot 10", unit: "forfait", unit_price: 150, nature: "services" },
  // Ventes de biens : objets livres, pas une prestation.
  { name: "Tirage d'art encadré 40x60", unit: "pièce", unit_price: 180, nature: "goods" },
  { name: "Album photo mariage, 40 pages", unit: "pièce", unit_price: 350, nature: "goods" },
];
const offre = (nom) => {
  const o = CATALOGUE.find((x) => x.name === nom);
  if (!o) throw new Error(`offre inconnue : ${nom}`);
  return o;
};
const ligne = (nom, quantite) => {
  const o = offre(nom);
  return { id: randomUUID(), description: o.name, quantity: quantite, unit: o.unit, unit_price: o.unit_price, total: r2(quantite * o.unit_price), nature: o.nature };
};

// -- Clients (ceux de l'annee factice d'origine) ------------------------------------
const CLIENTS = [
  { company: "Brasserie des Quais", name: "Brasserie des Quais", email: "contact@brasserie-quais.fr", siren: "978912301", street: "3 quai Richelieu", postcode: "33000", city: "Bordeaux" },
  { company: "Studio Nova SAS", name: "Studio Nova", email: "projets@studionova.fr", siren: "956789101", street: "9 rue Notre-Dame", postcode: "33000", city: "Bordeaux" },
  { company: "Æther Concept", name: "Boutique Æther", email: "contact@aether-concept.fr", siren: "967891201", street: "27 cours de la Libération", postcode: "33400", city: "Talence" },
  { company: "Horizon Immobilier", name: "Agence Horizon Immo", email: "contact@horizon-immo.fr", siren: "945678902", street: "40 avenue Pasteur", postcode: "33600", city: "Pessac" },
  { company: "Le Cèdre SARL", name: "Restaurant Le Cèdre", email: "resa@lecedre-bordeaux.fr", siren: "923456701", street: "18 quai des Chartrons", postcode: "33000", city: "Bordeaux" },
  { company: "Maison Perrin", name: "Maison Perrin", email: "hello@maisonperrin.fr", siren: "934567801", street: "5 avenue de la Libération", postcode: "33700", city: "Mérignac" },
  { company: "Domaine de Valmont SAS", name: "Domaine de Valmont", email: "contact@domaine-valmont.fr", siren: "912345600", street: "2 chemin des Vignes", postcode: "33330", city: "Saint-Émilion" },
  { company: "Lagarde Réceptions", name: "Événements Lagarde", email: "contact@lagarde-receptions.fr", siren: "989123401", street: "11 rue Carnot", postcode: "33130", city: "Bègles" },
];
const champsClient = (c) => ({
  client_name: c.name, client_email: c.email, client_company: c.company, client_siren: c.siren,
  client_street: c.street, client_postcode: c.postcode, client_city: c.city, client_country: "FR",
  client_address: `${c.street}, ${c.postcode} ${c.city}`,
});

// Paniers de lignes, parcourus dans l'ordre : prestations seules, biens seuls
// (tirages vendus a une boutique) et factures mixtes (reportage + album).
const PANIERS = [
  [["Shooting portrait corporate", 2]],
  [["Prise de vue drone", 1], ["Shooting immobilier / architecture", 1]],
  [["Reportage mariage - journée complète", 1], ["Album photo mariage, 40 pages", 1]],
  [["Montage vidéo - jusqu'à 3 min", 1]],
  [["Tirage d'art encadré 40x60", 3]],
  [["Photo culinaire - menu restaurant", 1], ["Prise de vue drone", 1]],
  [["Photographie de produit - lot 20 visuels", 1]],
  [["Captation vidéo événement - demi-journée", 1]],
  [["Captation vidéo - journée", 1], ["Montage vidéo - jusqu'à 3 min", 1]],
  [["Retouche photo - lot 10", 2]],
  [["Shooting immobilier / architecture", 1], ["Tirage d'art encadré 40x60", 2]],
  [["Captation vidéo - journée", 1]],
];

// -- Factures : novembre 2025 a aujourd'hui, trois par mois ---------------------------
const dates = [];
for (let an = 2025, mois = 10, k = 0; ; k++) {
  for (const j of [5 + (k % 3), 12 + (k % 4), 20 + (k % 3)]) {
    const d = `${an}-${String(mois + 1).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
    if (d <= AUJOURDHUI) dates.push(d);
  }
  mois++;
  if (mois === 12) { mois = 0; an++; }
  if (`${an}-${String(mois + 1).padStart(2, "0")}-01` > AUJOURDHUI) break;
}

const vendeur = {
  seller_name: profil.full_name, seller_company: profil.company_name, seller_siren: (profil.siret ?? "").slice(0, 9) || null,
  seller_tva_number: profil.tva_number ?? null, seller_street: profil.address_street, seller_postcode: profil.address_postcode,
  seller_city: profil.address_city, seller_country: "FR",
};
const parAn = new Map();
const factures = dates.map((d, i) => {
  const an = Number(d.slice(0, 4));
  const n = (parAn.get(an) ?? 0) + 1;
  parAn.set(an, n);
  const items = PANIERS[i % PANIERS.length].map(([nom, q]) => ligne(nom, q));
  const v = ventilationTva(items, 20);
  const categorie = deduireCategorie(items).categorie;
  if (!categorie) throw new Error("ligne sans nature");
  const derniere = i === dates.length - 1;
  const payee = !derniere && plusJours(d, 30) < AUJOURDHUI;
  const paidAt = payee ? plusJours(d, 15 + (i % 7)) : null;
  return {
    id: randomUUID(),
    user_id: COMPTE.id,
    invoice_number: `${an}-${String(n).padStart(3, "0")}`,
    ...vendeur,
    ...champsClient(CLIENTS[i % CLIENTS.length]),
    items,
    total_ht: v.total_ht,
    tva_rate: 20,
    total_ttc: v.total_ttc,
    type_code: "380",
    invoice_type: "standard",
    operation_category: categorie,
    payment_on_debit: false,
    language: "fr",
    status: derniere ? "draft" : payee ? "paid" : "sent",
    issue_date: d,
    due_date: plusJours(d, 30),
    payment_terms: "30 jours net",
    paid_at: paidAt,
    payment_mode: payee ? (i % 5 === 0 ? "carte" : "virement") : null,
    reminder_count: 0,
    created_at: `${d}T10:00:00Z`,
    updated_at: `${paidAt ?? d}T10:00:00Z`,
  };
});

// -- Devis (les six d'origine, natures en plus ; le premier devient mixte) -----------
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const dansJours = (j) => iso(new Date(Date.now() + j * 86_400_000));
const c = (societe) => CLIENTS.find((x) => x.company === societe);
const DEVIS = [
  { titre: "Reportage mariage + captation drone + album", client: "Domaine de Valmont SAS", lignes: [["Reportage mariage - journée complète", 1], ["Prise de vue drone", 1], ["Album photo mariage, 40 pages", 1]], statut: "signed", cree: 41, vu: 33, signe: 26, valide: -11 },
  { titre: "Captation vidéo soirée de gala", client: "Lagarde Réceptions", lignes: [["Captation vidéo - journée", 1], ["Montage vidéo - jusqu'à 3 min", 1]], statut: "signed", cree: 29, vu: 27, signe: 23, valide: 1 },
  { titre: "Shooting catalogue produits", client: "Studio Nova SAS", lignes: [["Photographie de produit - lot 20 visuels", 2]], statut: "sent", cree: 31, valide: -1 },
  { titre: "Reportage menu automne", client: "Æther Concept", lignes: [["Photo culinaire - menu restaurant", 1], ["Retouche photo - lot 10", 1]], statut: "viewed", cree: 35, vu: 30, valide: -5 },
  { titre: "Captation inauguration", client: "Brasserie des Quais", lignes: [["Captation vidéo événement - demi-journée", 1]], statut: "sent", cree: 47, valide: -17 },
  { titre: "Portraits équipe dirigeante, tirages pour l'accueil", client: "Maison Perrin", lignes: [["Shooting portrait corporate", 3], ["Tirage d'art encadré 40x60", 2]], statut: "draft", cree: 24, valide: 6 },
];
const devis = DEVIS.map((x, k) => {
  const items = x.lignes.map(([nom, q]) => ligne(nom, q));
  const v = ventilationTva(items, 20);
  return {
    user_id: COMPTE.id,
    created_by: COMPTE.id,
    proposal_number: `D-2026-${String(k + 1).padStart(3, "0")}`,
    title: x.titre,
    ...champsClient(c(x.client)),
    items,
    total_ht: v.total_ht,
    tva_rate: 20,
    total_ttc: v.total_ttc,
    status: x.statut,
    valid_until: dansJours(x.valide),
    payment_terms: "30% à la commande, solde à la livraison",
    share_token: randomUUID(),
    viewed_at: x.vu ? ilYa(x.vu) : null,
    signed_at: x.signe ? ilYa(x.signe) : null,
    reminder_count: 0,
    created_at: ilYa(x.cree),
    updated_at: ilYa(x.signe ?? x.vu ?? x.cree),
  };
});

// -- Avant / apres ----------------------------------------------------------------
async function compter() {
  const t = {};
  for (const table of ["invoices", "proposals", "service_catalog", "recurring_invoices", "document_sequences"]) {
    const { count } = await admin.from(table).select("*", { count: "exact", head: true }).eq("user_id", COMPTE.id);
    t[table] = count;
  }
  return t;
}
console.log("Avant :", JSON.stringify(await compter()));
if (process.argv.includes("--essai")) {
  const cat = factures.reduce((m, f) => ((m[f.operation_category] = (m[f.operation_category] ?? 0) + 1), m), {});
  console.log(`Essai, rien n'est ecrit : ${factures.length} factures ${JSON.stringify(cat)}, de ${factures[0].invoice_number} (${factures[0].issue_date}) a ${factures.at(-1).invoice_number} (${factures.at(-1).issue_date}), ${devis.length} devis, ${CATALOGUE.length} offres.`);
  process.exit(0);
}

// -- Purge (base seulement), puis semis ----------------------------------------------
// invoices.proposal_id est en ON DELETE SET NULL : l'ordre est indifferent.
for (const table of ["invoices", "proposals", "service_catalog", "recurring_invoices", "document_sequences"]) {
  const { error } = await admin.from(table).delete().eq("user_id", COMPTE.id);
  if (error) throw new Error(`purge ${table} : ${error.message}`);
}

const { error: eC } = await admin.from("service_catalog").insert(
  CATALOGUE.map((o) => ({ user_id: COMPTE.id, name: o.name, description: null, unit: o.unit, unit_price: o.unit_price, type: o.type ?? "fixed", nature: o.nature })),
);
if (eC) throw new Error(`catalogue : ${eC.message}`);
const { error: eF } = await admin.from("invoices").insert(factures);
if (eF) throw new Error(`factures : ${eF.message}`);
const { error: eD } = await admin.from("proposals").insert(devis);
if (eD) throw new Error(`devis : ${eD.message}`);

// Compteurs au niveau de ce qui vient d'etre ecrit (sinon le prochain numero
// genere retomberait sur un numero pris, cf. CLAUDE.md « Un compteur ne sait
// pas ce qui existe deja »).
const compteurs = [...parAn.entries()].map(([year, last_seq]) => ({ user_id: COMPTE.id, doc_type: "invoice", year, last_seq }));
compteurs.push({ user_id: COMPTE.id, doc_type: "proposal", year: 2026, last_seq: devis.length });
const { error: eS } = await admin.from("document_sequences").upsert(compteurs, { onConflict: "user_id,doc_type,year" });
if (eS) throw new Error(`compteurs : ${eS.message}`);

const parCat = factures.reduce((m, f) => ((m[f.operation_category] = (m[f.operation_category] ?? 0) + 1), m), {});
console.log("Après :", JSON.stringify(await compter()));
console.log(`Factures : ${factures.length} (${JSON.stringify(parCat)}), ${[...parAn.entries()].map(([a, n]) => `${a} : ${n}`).join(", ")}`);
