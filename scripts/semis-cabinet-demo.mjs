/**
 * Jeu de demonstration du cockpit cabinet (rendez-vous avec les cabinets).
 *
 * Un cabinet fictif et trois clients, chacun dans un etat different pour que
 * le tri par urgence se voie au premier coup d'oeil :
 *   - Boulangerie Durand   : raccordee, TVA a trois taux, un avoir : VERT
 *   - Studio Lumen         : raccordee, un litige, impayes, inactif : ORANGE
 *   - Ferrand Renovation   : NON raccordee, une facture sans SIREN : ROUGE
 * plus un code d'invitation en attente (« Garage Moreau »).
 *
 * Idempotent : relancer le script remet les dates a jour (tout est relatif a
 * aujourd'hui). A relancer la veille d'un rendez-vous.
 *
 * Securite, verifiee le 01/11/2026 :
 *   - profiles.is_demo = true : estCompteDemo (lib/garde-demo.ts) bloque tout
 *     effet reel (courriel, Chorus Pro, plateforme agreee, Stripe), la synchro
 *     nocturne Super PDP saute ces comptes, le pilotage admin les exclut ;
 *   - le raccordement est fictif (JETON_DEMO, comme la demo publique) ;
 *   - adresses @example.com (domaine reserve, aucun courrier ne peut y arriver)
 *     et NON @deviso.internal, que la purge des demos supprime au bout de 2 h ;
 *   - le script refuse de toucher un compte existant qui ne serait pas l'un
 *     des siens (is_demo absent ou raison sociale differente).
 *
 * Usage : node scripts/semis-cabinet-demo.mjs   (lit .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { randomInt, randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { secret } from "./e2e/lib.mjs";

const JETON_DEMO = "demo-fictif-jamais-utilise"; // = lib/superpdp.ts
const admin = createClient(secret("NEXT_PUBLIC_SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CABINET = {
  email: "deviso-demo-cabinet@example.com",
  full_name: "Claire Lefèvre",
  company_name: "Cabinet Lefèvre Conseil",
  siret: "91234567800021",
  address: "14 cours de l'Intendance, 33000 Bordeaux",
};

const CLIENTS = [
  {
    cle: "boulangerie",
    email: "deviso-demo-boulangerie@example.com",
    full_name: "Marc Durand",
    company_name: "Boulangerie Durand",
    siret: "84123657800017",
    address: "3 place du Marché, 33850 Léognan",
    tva_periodicite: "monthly",
    raccorde: true,
  },
  {
    cle: "studio",
    email: "deviso-demo-studio@example.com",
    full_name: "Inès Garnier",
    company_name: "Studio Lumen",
    siret: "88765432100015",
    address: "27 rue Sainte-Catherine, 33000 Bordeaux",
    tva_periodicite: "quarterly",
    raccorde: true,
  },
  {
    cle: "renovation",
    email: "deviso-demo-renovation@example.com",
    full_name: "Paul Ferrand",
    company_name: "Ferrand Rénovation",
    siret: "79345612800024",
    address: "8 avenue de la Libération, 33600 Pessac",
    tva_periodicite: "simplified",
    raccorde: false,
    trou: true,
  },
];

// -- Dates relatives a aujourd'hui ------------------------------------------
const MAINTENANT = new Date();
const jour = (n) => new Date(MAINTENANT.getTime() - n * 86_400_000);
const dateIso = (n) => jour(n).toISOString().slice(0, 10);
const tsIso = (n) => jour(n).toISOString();
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Mot de passe aleatoire conforme a la politique Supabase du projet (au moins
 * une minuscule, une majuscule et un chiffre, sinon 422 weak_password).
 */
function motDePasseFort(longueur = 16) {
  const MIN = "abcdefghjkmnpqrstuvwxyz", MAJ = "ABCDEFGHJKMNPQRSTUVWXYZ", CHI = "23456789";
  const tous = MIN + MAJ + CHI;
  const car = [MIN, MAJ, CHI].map((a) => a[randomInt(a.length)]);
  while (car.length < longueur) car.push(tous[randomInt(tous.length)]);
  for (let i = car.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [car[i], car[j]] = [car[j], car[i]];
  }
  return car.join("");
}

// -- Comptes ------------------------------------------------------------------
async function trouverUtilisateur(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function compte(fiche, motDePasse) {
  let u = await trouverUtilisateur(fiche.email);
  if (u) {
    const { data: p } = await admin.from("profiles").select("is_demo, company_name").eq("id", u.id).maybeSingle();
    if (!p?.is_demo || p.company_name !== fiche.company_name) {
      throw new Error(`${fiche.email} existe deja et n'est pas un compte de ce jeu de demonstration : abandon.`);
    }
    if (motDePasse) {
      const { error } = await admin.auth.admin.updateUserById(u.id, { password: motDePasse });
      if (error) throw error;
    }
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: fiche.email,
      password: motDePasse ?? motDePasseFort(),
      email_confirm: true,
      user_metadata: { full_name: fiche.full_name },
    });
    if (error) throw error;
    u = data.user;
  }
  const { error } = await admin.from("profiles").upsert({
    id: u.id,
    full_name: fiche.full_name,
    company_name: fiche.company_name,
    siret: fiche.siret,
    address: fiche.address,
    email: fiche.email,
    is_demo: true,
    ...(fiche.tva_periodicite ? { plan: "solo", tva_periodicite: fiche.tva_periodicite } : {}),
  });
  if (error) throw error;
  return u.id;
}

// -- Factures -----------------------------------------------------------------
function facture(userId, numero, o) {
  const items = o.lignes.map(([description, quantity, unit_price, tva_rate]) => ({
    id: randomUUID(),
    description,
    quantity,
    unit: "unité",
    unit_price,
    total: r2(quantity * unit_price),
    tva_rate,
  }));
  const ht = r2(items.reduce((s, l) => s + l.total, 0));
  const parTaux = new Map();
  for (const l of items) parTaux.set(l.tva_rate, (parTaux.get(l.tva_rate) ?? 0) + l.total);
  const tva = r2([...parTaux.entries()].reduce((s, [t, b]) => s + r2((b * t) / 100), 0));
  const estAvoir = !!o.avoirDe;
  return {
    id: o.id ?? randomUUID(),
    user_id: userId,
    invoice_number: numero,
    client_name: o.client.contact,
    client_email: o.client.email,
    client_company: o.client.societe ?? null,
    client_siren: o.client.siren ?? null,
    client_address: o.client.adresse,
    client_country: "FR",
    items,
    total_ht: ht,
    tva_rate: items[0].tva_rate,
    total_ttc: r2(ht + tva),
    status: o.statut,
    issue_date: dateIso(o.jours),
    due_date: dateIso(o.jours - 30),
    paid_at: o.statut === "paid" ? tsIso(Math.max(o.jours - 20, 0)) : null,
    payment_terms: "30 jours net",
    invoice_type: estAvoir ? "avoir" : "standard",
    type_code: estAvoir ? "381" : "380",
    linked_invoice_id: o.avoirDe ?? null,
    operation_category: o.biens ? "goods" : "services",
    payment_on_debit: false,
    reminder_count: 0,
    superpdp_status: o.pa ?? null,
    superpdp_status_date: o.pa ? tsIso(Math.max(o.jours - 1, 0)) : null,
    created_at: tsIso(o.jours),
    updated_at: tsIso(Math.max(o.jours - 20, 0)),
  };
}

/**
 * Numerote comme Deviso : « AAAA-NNN », une SEULE serie par an partagee par les
 * factures et les avoirs (confirme sur les donnees reelles). Ordre chronologique.
 */
function numeroter(liste) {
  const parAn = new Map();
  return [...liste]
    .sort((a, b) => b.jours - a.jours)
    .map((o) => {
      const an = jour(o.jours).getFullYear();
      const n = (parAn.get(an) ?? 0) + 1;
      parAn.set(an, n);
      return { ...o, numero: `${an}-${String(n).padStart(3, "0")}`, an, n };
    });
}

/**
 * Perce un trou volontaire dans la serie d'une annee : le numero (apres + 1)
 * manque, les suivants sont decales. Sert la demo (un comptable cherche d'abord
 * les trous de numerotation). Le trou doit rester interieur (ni premier, ni
 * dernier) pour etre detecte.
 */
function perforer(numerotees, annee, apres) {
  return numerotees.map((o) => {
    if (o.an !== annee || o.n <= apres) return o;
    const n = o.n + 1;
    return { ...o, n, numero: `${annee}-${String(n).padStart(3, "0")}` };
  });
}

const HOTEL = { contact: "Sylvie Morin", email: "achats@hotel-medoc.example.com", societe: "Hôtel Le Médoc", siren: "512398741", adresse: "2 allée de Tourny, 33000 Bordeaux" };
const TREILLE = { contact: "Julien Roux", email: "julien@latreille.example.com", societe: "Restaurant La Treille", siren: "830145962", adresse: "11 rue du Pas-Saint-Georges, 33000 Bordeaux" };
const AGENCE = { contact: "Nadia Benali", email: "nadia@agence-cap.example.com", societe: "Agence Cap Ouest", siren: "752190384", adresse: "5 quai des Chartrons, 33000 Bordeaux" };
const VIGNOBLE = { contact: "Henri Castel", email: "contact@chateau-castel.example.com", societe: "Château Castel", siren: "394512876", adresse: "Route des Graves, 33650 Martillac" };
const SCI = { contact: "Gérard Lamy", email: "gerant@sci-tilleuls.example.com", societe: "SCI Les Tilleuls", siren: null, adresse: "40 rue des Tilleuls, 33400 Talence" };
const PARTICULIER = { contact: "Anne Dupuis", email: "anne.dupuis@example.com", adresse: "6 impasse des Lilas, 33170 Gradignan" };
const AGENCE_IMMO = { contact: "Thomas Vidal", email: "t.vidal@immo-graves.example.com", societe: "Immo des Graves", siren: "481236590", adresse: "9 place de la Mairie, 33850 Léognan" };

function scenario(cle) {
  const L = [];
  if (cle === "boulangerie") {
    // Livraisons regulieres sur 13 mois, trois taux. Un avoir (geste commercial).
    for (let j = 390, i = 0; j >= 0; j -= 26, i++) {
      const recent = j <= 60;
      L.push({
        jours: j,
        client: i % 2 ? TREILLE : HOTEL,
        biens: true,
        lignes: [
          ["Pains et viennoiseries, livraisons du mois", 1, 640 + (i % 4) * 55, 5.5],
          ...(i % 3 === 0 ? [["Buffet traiteur, séminaire", 1, 480, 10]] : []),
          ...(i % 4 === 0 ? [["Location de vaisselle", 1, 90, 20]] : []),
        ],
        statut: j > 35 ? "paid" : "sent",
        pa: recent ? (j > 35 ? "fr:212" : "fr:203") : null,
        id: i === 9 ? "AVOIR_CIBLE" : undefined,
      });
    }
    L.push({ jours: 100, client: HOTEL, biens: true, lignes: [["Geste commercial, livraison incomplète", 1, 120, 5.5]], statut: "paid", avoirDe: "AVOIR_CIBLE" });
  }
  if (cle === "studio") {
    // Prestations mensuelles jusqu'il y a deux mois, puis plus rien.
    for (let j = 380, i = 0; j >= 62; j -= 31, i++) {
      L.push({
        jours: j,
        client: i % 2 ? AGENCE : VIGNOBLE,
        lignes: [["Identité visuelle et déclinaisons", 1, 1200 + (i % 3) * 300, 20]],
        statut: j > 90 ? "paid" : "sent",
        pa: j <= 90 ? (j <= 70 ? "fr:207" : "fr:203") : null,
      });
    }
  }
  if (cle === "renovation") {
    for (let j = 370, i = 0; j >= 0; j -= 34, i++) {
      L.push({
        jours: j,
        client: i % 3 === 2 ? PARTICULIER : AGENCE_IMMO,
        lignes: [
          ["Travaux de rénovation, salle d'eau", 1, 2400 + (i % 3) * 400, 10],
          ["Fournitures et matériaux", 1, 650, 20],
        ],
        statut: j > 35 ? "paid" : "sent",
      });
    }
    L.push({ jours: 12, client: SCI, lignes: [["Réfection de toiture, lot 2", 1, 3800, 10]], statut: "sent" });
  }
  return L;
}

async function semerClient(c, userId, cabinetId) {
  // Remise a zero de CE compte de demonstration uniquement.
  for (const [table, col] of [["invoices", "user_id"], ["superpdp_connections", "user_id"], ["team_members", "owner_id"], ["document_sequences", "user_id"]]) {
    const { error } = await admin.from(table).delete().eq(col, userId);
    if (error) throw new Error(`${table} : ${error.message}`);
  }

  const numerotees = c.trou
    ? perforer(numeroter(scenario(c.cle)), MAINTENANT.getFullYear(), 4)
    : numeroter(scenario(c.cle));
  const ids = new Map();
  for (const o of numerotees) if (o.id) ids.set(o.id, randomUUID());
  const lignes = numerotees.map((o) =>
    facture(userId, o.numero, { ...o, id: o.id ? ids.get(o.id) : undefined, avoirDe: o.avoirDe ? ids.get(o.avoirDe) : undefined }),
  );
  const { error: errF } = await admin.from("invoices").insert(lignes);
  if (errF) throw new Error(`factures ${c.company_name} : ${errF.message}`);

  // Compteurs de numerotation au niveau de ce qui vient d'etre seme.
  const maxParAn = new Map();
  for (const o of numerotees) maxParAn.set(o.an, Math.max(maxParAn.get(o.an) ?? 0, o.n));
  for (const [year, last_seq] of maxParAn) {
    const { error } = await admin.from("document_sequences").upsert({ user_id: userId, doc_type: "invoice", year, last_seq }, { onConflict: "user_id,doc_type,year" });
    if (error) throw new Error(`compteur ${c.company_name} ${year} : ${error.message}`);
  }

  if (c.raccorde) {
    const siren = c.siret.slice(0, 9);
    const { error } = await admin.from("superpdp_connections").insert({
      user_id: userId,
      refresh_token: JETON_DEMO,
      session_status: "verified",
      company_number: siren,
      company_number_scheme: "fr_siren",
      company_id: `DEMO-${siren}`,
      directory_id: "demo-annuaire",
      directory_address: `0225:${siren}`,
      connected_at: tsIso(75),
      last_sync_at: MAINTENANT.toISOString(),
      updated_at: MAINTENANT.toISOString(),
    });
    if (error) throw new Error(`raccordement ${c.company_name} : ${error.message}`);
  }

  const { error: errLien } = await admin.from("team_members").insert({
    owner_id: userId,
    member_id: cabinetId,
    email: CABINET.email,
    role: "comptable",
    status: "active",
    invited_at: tsIso(90),
    accepted_at: tsIso(90),
  });
  if (errLien) throw new Error(`lien cabinet ${c.company_name} : ${errLien.message}`);
  return lignes.length;
}

// -- Execution ------------------------------------------------------------------
let motDePasse = process.env.CABINET_DEMO_PASSWORD;
try { motDePasse = motDePasse ?? secret("CABINET_DEMO_PASSWORD"); } catch { /* premiere execution */ }
let nouveau = false;
if (!motDePasse) {
  motDePasse = motDePasseFort();
  nouveau = true;
}

const cabinetId = await compte(CABINET, motDePasse);
if (nouveau) {
  appendFileSync(".env.local", `\n# Compte de demonstration du cockpit cabinet (scripts/semis-cabinet-demo.mjs)\nCABINET_DEMO_EMAIL=${CABINET.email}\nCABINET_DEMO_PASSWORD=${motDePasse}\n`);
}

for (const c of CLIENTS) {
  const id = await compte(c);
  const n = await semerClient(c, id, cabinetId);
  console.log(`  ${c.company_name.padEnd(22)} ${n} factures, ${c.raccorde ? "raccordé" : "non raccordé"}`);
}

// Un code en attente, pour montrer l'invitation d'un nouveau client.
await admin.from("cabinet_invitations").delete().eq("cabinet_id", cabinetId);
const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const bloc = () => Array.from({ length: 4 }, () => A[randomInt(A.length)]).join("");
const { error: errInv } = await admin.from("cabinet_invitations").insert({ cabinet_id: cabinetId, code: `${bloc()}-${bloc()}`, libelle: "Garage Moreau" });
if (errInv) throw new Error(`invitation : ${errInv.message}`);

console.log("");
console.log(`Cabinet : ${CABINET.company_name}, 3 dossiers rattachés, 1 code en attente.`);
console.log(`Connexion : ${CABINET.email}`);
console.log(nouveau ? "Mot de passe genere et ajoute a .env.local (CABINET_DEMO_PASSWORD)." : "Mot de passe inchange (.env.local).");
