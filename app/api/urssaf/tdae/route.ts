import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { can } from "@/lib/plans";
import { getPlan } from "@/lib/stripe";
import { lireFacturesPayees, lignesRecettes } from "@/lib/recettes";
import {
  type PeriodeTdae,
  type Periodicite,
  periodeADeclarer,
  caDeLaPeriode,
  dateExigibilite,
  libellePeriode,
  estPeriodeValide,
  periodeConformeA,
} from "@/lib/urssaf-periodes";
import {
  ErreurTdae,
  MESSAGES_ERREUR,
  clientTdae,
  lireConfigTdae,
  amorcerSimulation,
  construireCa,
  cotisationsDues,
  estCategorieCa,
  CATEGORIES_CA,
  type ClientTdae,
  type CategorieCa,
} from "@/lib/urssaf-tdae";

/**
 * Télédéclaration du chiffre d'affaires à l'URSSAF (API TDAE).
 *
 * GET  : état du mandat, période à déclarer et CA calculé depuis le livre des
 *        recettes, historique des déclarations.
 * POST : { action: "mandat" | "revoquer" | "estimer" | "declarer", ... }
 *
 * Acte du titulaire seul : c'est sa situation sociale. Tant que
 * URSSAF_TDAE_MODE n'est pas défini, la route répond 404 : on n'expose pas
 * une fonction qui ne marche pas.
 *
 * Règle de déclaration : Deviso propose, l'utilisateur décide. Le montant
 * transmis est recalculé ici et doit être celui que l'utilisateur a vu et
 * confirmé (`montantConfirme`) ; s'il a changé entre-temps (facture marquée
 * payée dans un autre onglet), on refuse et on renvoie le nouveau montant.
 */

type Compte = {
  user_id: string;
  siret: string;
  categorie_ca: CategorieCa;
  periodicite: Periodicite;
  debut_activite: string | null;
  acre: boolean | null;
  mandat_statut: "actif" | "revoque";
  mandat_signe_at: string | null;
  mandat_revoque_at: string | null;
  mode: string;
};

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

function aujourdhuiParis(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

/** date_etat de l'API 020 : JJ/MM/AAAA => AAAA-MM-JJ. */
function dateEtatIso(v: string | undefined): string | null {
  const m = v?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function reponseErreur(e: unknown) {
  if (e instanceof ErreurTdae) {
    const status = e.code === "ERR_TECHNIQUE" || e.code === "AUTH_REFUSEE" || e.code === "INCONNU" ? 502 : e.code === "QUOTA_DEPASSE" ? 429 : 400;
    return NextResponse.json({ error: e.code, message: e.message }, { status });
  }
  console.error("[urssaf-tdae]", e);
  return NextResponse.json({ error: "INCONNU", message: MESSAGES_ERREUR.INCONNU }, { status: 500 });
}

async function contexte() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { refus: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) } as const;
  const workspaceId = await getWorkspaceUserId(user.id);
  const refusT = exigerTitulaire(user.id, workspaceId);
  if (refusT) return { refus: refusT } as const;
  const profil = await getWorkspaceProfile<{ plan: string | null; siret: string | null }>(workspaceId, "plan, siret");
  const plan = getPlan(profil?.plan);
  if (!can(plan, "teledeclarationUrssaf")) {
    return { refus: NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 }) } as const;
  }
  const cfg = lireConfigTdae();
  const client = clientTdae(cfg);
  if (!cfg || !client) {
    return { refus: NextResponse.json({ error: "CONFIG_ABSENTE", message: MESSAGES_ERREUR.CONFIG_ABSENTE }, { status: 404 }) } as const;
  }
  const siret = (profil?.siret ?? "").replace(/\s/g, "");
  const { data: compte } = await supabase
    .from("urssaf_tdae_comptes")
    .select("*")
    .eq("user_id", workspaceId)
    .maybeSingle<Compte>();
  if (client.mode === "simulation" && /^\d{14}$/.test(siret)) {
    amorcerSimulation(siret, {
      mandatAt: compte?.mandat_statut === "actif" ? (compte.mandat_signe_at ?? "").slice(0, 10) || null : null,
      ...(compte ? { periodicite: compte.periodicite } : {}),
    });
  }
  return { supabase, workspaceId, client, siret, compte: compte ?? null } as const;
}

async function caPour(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, p: PeriodeTdae) {
  const lignes = lignesRecettes(await lireFacturesPayees(supabase, workspaceId, p.annee), p.annee);
  return caDeLaPeriode(lignes, p);
}

export async function GET() {
  const ctx = await contexte();
  if ("refus" in ctx) return ctx.refus;
  const { supabase, workspaceId, client, siret, compte } = ctx;

  const { data: declarations } = await supabase
    .from("urssaf_tdae_declarations")
    .select("id, created_at, annee, mois, trimestre, montant_declare, cotisations_dues, date_exigibilite, certificat, mode")
    .eq("user_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(24);

  let aDeclarer = null;
  if (compte?.mandat_statut === "actif") {
    const periode = periodeADeclarer(compte.periodicite, aujourdhuiParis());
    const ca = await caPour(supabase, workspaceId, periode);
    const derniere = (declarations ?? []).find(
      (d) => d.annee === periode.annee && (d.mois ?? null) === (periode.mois ?? null) && (d.trimestre ?? null) === (periode.trimestre ?? null)
    );
    aDeclarer = {
      periode,
      libelle: libellePeriode(periode),
      exigibilite: dateExigibilite(periode, compte.periodicite, compte.debut_activite),
      ca,
      dejaDeclaree: derniere ?? null,
    };
  }

  return NextResponse.json({
    mode: client.mode,
    siret: /^\d{14}$/.test(siret) ? siret : null,
    categories: CATEGORIES_CA,
    compte,
    aDeclarer,
    declarations: declarations ?? [],
  });
}

export async function POST(req: NextRequest) {
  const ctx = await contexte();
  if ("refus" in ctx) return ctx.refus;
  const { supabase, workspaceId, client, siret, compte } = ctx;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: "SIRET_MANQUANT", message: "Renseignez votre SIRET (14 chiffres) dans vos paramètres avant de mandater Deviso." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "mandat":
        return await donnerMandat(client, supabase, workspaceId, siret, body);
      case "revoquer":
        return await revoquerMandat(client, supabase, workspaceId, siret, compte, body);
      case "estimer":
      case "declarer": {
        if (compte?.mandat_statut !== "actif") {
          return NextResponse.json({ error: "MDT_INCONNU", message: MESSAGES_ERREUR.MDT_INCONNU }, { status: 400 });
        }
        if (compte.siret !== siret) {
          return NextResponse.json({ error: "SIRET_CHANGE", message: "Votre SIRET a changé depuis le mandat : révoquez-le puis donnez-en un nouveau." }, { status: 409 });
        }
        const brute = body.periode === undefined ? periodeADeclarer(compte.periodicite, aujourdhuiParis()) : body.periode;
        if (!estPeriodeValide(brute) || !periodeConformeA(brute, compte.periodicite)) {
          return NextResponse.json({ error: "PERIODICITE_INVALIDE", message: MESSAGES_ERREUR.PERIODICITE_INVALIDE }, { status: 400 });
        }
        // Reconstruite champ par champ : rien d'autre que le contrat ne part.
        const periode: PeriodeTdae =
          brute.mois !== undefined ? { annee: brute.annee, mois: brute.mois } : { annee: brute.annee, trimestre: brute.trimestre! };
        const ca = await caPour(supabase, workspaceId, periode);
        const caAe = construireCa(compte.categorie_ca, ca.montantDeclarable);
        if (body.action === "estimer") {
          const r = await client.estimer(siret, caAe);
          return NextResponse.json({ periode, ca, montants: r.montants, cotisationsDues: cotisationsDues(r.montants) });
        }
        return await declarer(client, supabase, workspaceId, siret, compte, periode, ca, caAe, body);
      }
      default:
        return NextResponse.json({ error: "ACTION_INCONNUE" }, { status: 400 });
    }
  } catch (e) {
    return reponseErreur(e);
  }
}

async function donnerMandat(
  client: ClientTdae,
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  siret: string,
  body: Record<string, unknown>
) {
  const dateNaissance = typeof body.dateNaissance === "string" ? body.dateNaissance : "";
  if (!DATE_ISO.test(dateNaissance)) {
    return NextResponse.json({ error: "PARAM_INVALIDE", message: "Date de naissance invalide." }, { status: 400 });
  }
  if (!estCategorieCa(body.categorie)) {
    return NextResponse.json({ error: "CATEGORIE_INVALIDE", message: "Choisissez la nature de votre activité." }, { status: 400 });
  }
  if (body.consentement !== true) {
    return NextResponse.json({ error: "CONSENTEMENT_REQUIS", message: "Le mandat doit être accepté explicitement." }, { status: 400 });
  }
  // API 020 d'abord : compte existant, périodicité, mandat déjà donné à Deviso.
  const infos = await client.verifierCompte(siret);
  if (!infos.mandatPresent) await client.notifierMandat(siret, dateNaissance);
  const maintenant = new Date().toISOString();
  const { data, error } = await supabase
    .from("urssaf_tdae_comptes")
    .upsert({
      user_id: workspaceId,
      siret,
      categorie_ca: body.categorie,
      periodicite: infos.periodicite,
      debut_activite: dateEtatIso(infos.date_etat),
      acre: infos.exoAccrePresent ?? null,
      mandat_statut: "actif",
      mandat_signe_at: maintenant,
      mandat_revoque_at: null,
      mode: client.mode,
      updated_at: maintenant,
    })
    .select("*")
    .single();
  if (error) {
    // Le mandat est enregistré à l'URSSAF mais pas chez nous : on le dit, pour
    // que la prochaine tentative (API 020 => mandatPresent) le rattrape.
    console.error("[urssaf-tdae] mandat non enregistré localement", error);
    return NextResponse.json({ error: "ENREGISTREMENT_LOCAL", message: "Mandat transmis à l'URSSAF, mais non enregistré par Deviso. Réessayez : il sera retrouvé." }, { status: 500 });
  }
  return NextResponse.json({ compte: data });
}

async function revoquerMandat(
  client: ClientTdae,
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  siret: string,
  compte: Compte | null,
  body: Record<string, unknown>
) {
  const dateNaissance = typeof body.dateNaissance === "string" ? body.dateNaissance : "";
  if (!DATE_ISO.test(dateNaissance)) {
    return NextResponse.json({ error: "PARAM_INVALIDE", message: "Date de naissance invalide." }, { status: 400 });
  }
  if (compte?.mandat_statut !== "actif") {
    return NextResponse.json({ error: "MDT_INCONNU", message: MESSAGES_ERREUR.MDT_INCONNU }, { status: 400 });
  }
  await client.annulerMandat(compte.siret ?? siret, dateNaissance);
  const maintenant = new Date().toISOString();
  await supabase
    .from("urssaf_tdae_comptes")
    .update({ mandat_statut: "revoque", mandat_revoque_at: maintenant, updated_at: maintenant })
    .eq("user_id", workspaceId);
  return NextResponse.json({ ok: true });
}

async function declarer(
  client: ClientTdae,
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  siret: string,
  compte: Compte,
  periode: PeriodeTdae,
  ca: Awaited<ReturnType<typeof caPour>>,
  caAe: ReturnType<typeof construireCa>,
  body: Record<string, unknown>
) {
  if (body.montantConfirme !== ca.montantDeclarable) {
    return NextResponse.json(
      { error: "MONTANT_CHANGE", message: "Le chiffre d'affaires de la période a changé. Vérifiez le nouveau montant avant d'envoyer.", ca },
      { status: 409 }
    );
  }
  if (ca.datesEstimees > 0 && body.accepteDatesEstimees !== true) {
    return NextResponse.json(
      { error: "DATES_ESTIMEES", message: "Certains encaissements n'ont pas de date réelle : vérifiez qu'ils appartiennent bien à cette période.", ca },
      { status: 409 }
    );
  }
  const r = await client.declarer(siret, caAe, periode);
  const dues = cotisationsDues(r.montants);
  const { error } = await supabase.from("urssaf_tdae_declarations").insert({
    user_id: workspaceId,
    annee: periode.annee,
    mois: periode.mois ?? null,
    trimestre: periode.trimestre ?? null,
    categorie_ca: compte.categorie_ca,
    encaisse_ht: ca.encaisseHt,
    montant_declare: ca.montantDeclarable,
    montants: r.montants,
    cotisations_dues: dues,
    date_exigibilite: r.dateExigibilite,
    certificat: r.certificat,
    id_declaration: r.idDeclaration,
    mode: client.mode,
  });
  if (error) {
    // La déclaration est partie : l'URSSAF l'a enregistrée et a envoyé son mail
    // à l'utilisateur. On renvoie l'accusé quoi qu'il arrive.
    console.error("[urssaf-tdae] déclaration transmise mais non journalisée", error);
  }
  return NextResponse.json({
    periode,
    libelle: libellePeriode(periode),
    montantDeclare: ca.montantDeclarable,
    montants: r.montants,
    cotisationsDues: dues,
    dateExigibilite: r.dateExigibilite,
    certificat: r.certificat,
    journalise: !error,
  });
}
