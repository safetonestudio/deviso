import OpenAI from "openai";
import { lazyClient } from "@/lib/lazy-client";

/**
 * Extraction assistée d'un achat depuis la facture PDF ou photo du fournisseur.
 *
 * Pourquoi c'est prudent malgré l'hétérogénéité des factures étrangères. Le
 * résultat ne PRÉ-REMPLIT que le formulaire : rien n'est stocké ni transmis
 * sans que l'utilisateur relise et valide. Deux garde-fous portent la fiabilité :
 *  - le modèle a pour consigne de rendre `null` tout champ qu'il ne lit pas avec
 *    certitude, plutôt que de deviner (un champ vide se voit et se corrige ; une
 *    valeur inventée passerait inaperçue) ;
 *  - la route qui l'appelle recontrôle la cohérence (TVA vs taux, pays connu,
 *    date valide) et signale les écarts à l'utilisateur.
 *
 * On lit le fournisseur, c'est-à-dire l'ÉMETTEUR de la facture (le vendeur), pas
 * nous qui sommes l'acheteur : la facture porte les deux, la confusion serait
 * une déclaration à la mauvaise identité.
 */

const openai = lazyClient(() => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

export interface ExtractionAchat {
  fournisseur_nom: string | null;
  fournisseur_pays: string | null; // ISO 3166-1 alpha-2
  fournisseur_tva: string | null;
  numero: string | null;
  date_facture: string | null; // YYYY-MM-DD
  categorie: "biens" | "services" | null;
  devise: string | null; // ISO 4217
  montant_ht: number | null;
  taux_tva: number | null;
  montant_tva: number | null;
  confiance: "haute" | "moyenne" | "basse" | null;
}

/** Types de fichiers acceptés pour l'extraction. */
export const TYPES_EXTRACTION = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const CONSIGNE = `Tu extrais les données d'UNE facture d'achat pour la déclaration d'e-reporting d'acquisition d'une entreprise française.

Le document est la facture émise par un FOURNISSEUR étranger. Tu dois renseigner les informations du FOURNISSEUR, c'est-à-dire l'émetteur/vendeur de la facture, JAMAIS celles de l'acheteur/destinataire (l'entreprise française cliente).

Règles impératives :
- Si une information n'est pas présente ou que tu n'es pas certain de la lire correctement, renvoie null pour ce champ. Ne devine jamais, n'invente aucune valeur.
- fournisseur_pays : code pays ISO à 2 lettres du fournisseur (ex : DE, IT, BE), déduit de son adresse ou du préfixe de son numéro de TVA.
- fournisseur_tva : numéro de TVA intracommunautaire du fournisseur tel qu'écrit (ex : DE811569869), sans espaces.
- date_facture : date d'émission au format AAAA-MM-JJ.
- categorie : "services" pour une prestation, "biens" pour des marchandises. null si ce n'est pas clair.
- devise : code ISO 3 lettres (EUR, USD, GBP...).
- montant_ht, montant_tva : nombres, point décimal, sans symbole de devise ni séparateur de milliers.
- taux_tva : pourcentage en nombre (ex : 20 pour 20 %). Si la facture est en autoliquidation (reverse charge, mention "autoliquidation" / "reverse charge" / TVA à 0), alors taux_tva = 0 et montant_tva = 0.
- confiance : ton niveau de confiance global sur l'extraction ("haute", "moyenne", "basse").`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    fournisseur_nom: { type: ["string", "null"] },
    fournisseur_pays: { type: ["string", "null"] },
    fournisseur_tva: { type: ["string", "null"] },
    numero: { type: ["string", "null"] },
    date_facture: { type: ["string", "null"] },
    categorie: { type: ["string", "null"], enum: ["biens", "services", null] },
    devise: { type: ["string", "null"] },
    montant_ht: { type: ["number", "null"] },
    taux_tva: { type: ["number", "null"] },
    montant_tva: { type: ["number", "null"] },
    confiance: { type: ["string", "null"], enum: ["haute", "moyenne", "basse", null] },
  },
  required: [
    "fournisseur_nom",
    "fournisseur_pays",
    "fournisseur_tva",
    "numero",
    "date_facture",
    "categorie",
    "devise",
    "montant_ht",
    "taux_tva",
    "montant_tva",
    "confiance",
  ],
} as const;

/**
 * Envoie le fichier (data URL base64) au modèle et rend les champs extraits.
 * `mime` doit appartenir à TYPES_EXTRACTION.
 */
export async function extraireAchat(dataUrl: string, mime: string, filename: string): Promise<ExtractionAchat> {
  const estPdf = mime === "application/pdf";

  const contenu = estPdf
    ? ([
        { type: "input_text", text: "Facture d'achat à extraire :" },
        { type: "input_file", filename, file_data: dataUrl },
      ] as const)
    : ([
        { type: "input_text", text: "Facture d'achat à extraire :" },
        { type: "input_image", image_url: dataUrl, detail: "high" },
      ] as const);

  const reponse = await openai.responses.create({
    model: "gpt-4o",
    temperature: 0,
    instructions: CONSIGNE,
    input: [{ role: "user", content: contenu as never }],
    text: { format: { type: "json_schema", name: "achat_extrait", strict: true, schema: SCHEMA as never } },
  });

  const texte = reponse.output_text;
  if (!texte) throw new Error("Extraction vide");
  return JSON.parse(texte) as ExtractionAchat;
}
