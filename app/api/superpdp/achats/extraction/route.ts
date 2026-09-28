import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceUserId } from "@/lib/workspace";
import { exigerTitulaire } from "@/lib/droits";
import { paysFrancais } from "@/lib/superpdp-nature";
import { extraireAchat, TYPES_EXTRACTION, type ExtractionAchat } from "@/lib/openai-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Extraction assistée d'un achat depuis la facture PDF/photo du fournisseur.
 *
 * Ne stocke rien et ne transmet rien : renvoie seulement des champs pour
 * pré-remplir le formulaire, que l'utilisateur relit et valide avant d'enregistrer.
 * On recontrôle ici la cohérence de ce que le modèle a lu et on signale les
 * écarts, pour que l'utilisateur sache quoi vérifier en priorité.
 */

const TAILLE_MAX = 10 * 1024 * 1024; // 10 Mo

function nombreOuNull(v: number | null): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const refus = exigerTitulaire(user.id, workspaceId);
  if (refus) return refus;

  let fichier: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("fichier");
    if (f instanceof File) fichier = f;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!fichier) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }
  if (!TYPES_EXTRACTION.includes(fichier.type)) {
    return NextResponse.json(
      { error: "Format non pris en charge", message: "Envoyez un PDF ou une image (PNG, JPEG, WebP)." },
      { status: 415 }
    );
  }
  if (fichier.size > TAILLE_MAX) {
    return NextResponse.json(
      { error: "Fichier trop volumineux", message: "La facture doit peser moins de 10 Mo." },
      { status: 413 }
    );
  }

  let brut: ExtractionAchat;
  try {
    const buffer = Buffer.from(await fichier.arrayBuffer());
    const dataUrl = `data:${fichier.type};base64,${buffer.toString("base64")}`;
    brut = await extraireAchat(dataUrl, fichier.type, fichier.name || "facture");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Lecture impossible",
        message:
          "La facture n'a pas pu être lue automatiquement. Vous pouvez saisir les champs à la main.",
        detail: detail.slice(0, 300),
      },
      { status: 502 }
    );
  }

  // Normalisation et contrôles de cohérence. On ne « corrige » jamais en
  // silence : on nettoie la forme (casse, espaces, arrondis) et on SIGNALE tout
  // écart, en laissant la valeur telle quelle pour que l'utilisateur tranche.
  const avertissements: string[] = [];

  const pays = brut.fournisseur_pays?.trim().toUpperCase() || null;
  if (pays && !/^[A-Z]{2}$/.test(pays)) {
    avertissements.push("Le pays du fournisseur n'a pas été lu comme un code à deux lettres, vérifiez-le.");
  } else if (pays && paysFrancais(pays)) {
    avertissements.push("La facture semble venir d'un fournisseur français : un achat auprès d'un fournisseur français n'est pas un achat international.");
  }

  const tva = brut.fournisseur_tva?.replace(/\s+/g, "").toUpperCase() || null;

  let date = brut.date_facture?.trim() || null;
  if (date && Number.isNaN(Date.parse(date))) {
    avertissements.push("La date de facture n'a pas été lue dans un format sûr, vérifiez-la.");
    date = null;
  }

  const ht = nombreOuNull(brut.montant_ht);
  const taux = nombreOuNull(brut.taux_tva);
  const montantTva = nombreOuNull(brut.montant_tva);

  if (ht !== null && taux !== null && montantTva !== null && taux > 0) {
    const attendu = Math.round(ht * (taux / 100) * 100) / 100;
    if (Math.abs(attendu - montantTva) > Math.max(0.02, attendu * 0.01)) {
      avertissements.push(`Le montant de TVA lu (${montantTva}) ne correspond pas au taux (${taux}% de ${ht} = ${attendu}). Vérifiez les montants.`);
    }
  }
  if (montantTva !== null && montantTva > 0 && (taux === null || taux === 0)) {
    avertissements.push("Un montant de TVA a été lu mais pas de taux : vérifiez s'il s'agit d'une autoliquidation.");
  }

  const champs = {
    fournisseur_nom: brut.fournisseur_nom?.trim() || null,
    fournisseur_pays: pays,
    fournisseur_tva: tva,
    numero: brut.numero?.trim() || null,
    date_facture: date,
    categorie: brut.categorie === "biens" || brut.categorie === "services" ? brut.categorie : null,
    devise: brut.devise?.trim().toUpperCase() || null,
    montant_ht: ht,
    taux_tva: taux,
    montant_tva: montantTva,
  };

  const nonLus = Object.entries(champs)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  return NextResponse.json({
    champs,
    avertissements,
    nonLus,
    confiance: brut.confiance ?? null,
  });
}
