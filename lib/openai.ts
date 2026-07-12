import OpenAI from "openai";
import type { GeneratedProposal } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export interface CatalogItemContext {
  name: string;
  description: string | null;
  unit: string | null;
  unit_price: number;
  type: "fixed" | "hourly";
}

export interface UserContext {
  name: string | null;
  company: string | null;
  tvaRegime: string | null;
  tvaRate: number;
  avgProjectTotal: number | null;
  avgDailyRate: number | null;
  avgItemCount: number | null;
  commonUnits: string[];
  typicalPaymentTerms: string | null;
  recentProjects: string[];
  plan: string;
  catalogItems: CatalogItemContext[];
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const TVA_REGIME_LABELS: Record<string, string> = {
  franchise:     "Franchise en base de TVA (art. 293 B CGI), pas de TVA facturée",
  normal:        "Assujetti TVA, taux normal 20%",
  intermediaire: "Assujetti TVA, taux intermédiaire 10%",
  reduit:        "Assujetti TVA, taux réduit 5,5%",
  super_reduit:  "Assujetti TVA, taux super réduit 2,1%",
};

/** Détecte le secteur d'activité à partir du brief et retourne des repères de prix + structure */
function detectSector(brief: string): string {
  const b = brief.toLowerCase();

  if (/\b(dev(elop)?|code|coder|site\s*web|webapp|appli|next\.?js|react|angular|vue|wordpress|php|python|node|api|backend|frontend|fullstack)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Développement web / logiciel
TJM marché FR : 400–900€/jour HT selon spécialité et expérience
Structure typique : Analyse & cadrage → Développement → Tests & recette → Livraison & déploiement
Unités courantes : jour, forfait
Pratiques secteur : acompte 30–40% à la commande, solde à la livraison. Inclure clause de maintenance si pertinent.`;
  }

  if (/\b(design|logo|graphi(sme|ste)|charte|identit(é|e)\s*visuel|ui|ux|maquette|figma|branding|illustration|print|affiche|flyer)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Design & graphisme
Forfaits marché FR : logo simple 500–900€, identité visuelle complète 1 800–5 000€, maquettes UI 1 200–3 500€
Structure typique : Brief & recherche créative → Propositions → Révisions → Livraison fichiers sources
Unités courantes : forfait, heure
Spécificités secteur : TOUJOURS inclure une clause droits de cession (support, durée, territoire). Préciser nb propositions initiales + nb cycles de révisions.`;
  }

  if (/\b(photo|photographe|vid(é|e)o|vid(é|e)aste|tournage|montage|reportage|clip|motion\s*design|drone)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Photographie & vidéo
Tarifs marché FR : demi-journée 350–700€, journée 700–1 400€, montage vidéo 400–1 200€
Structure typique : Préparation / sopérage → Prise de vue / tournage → Post-traitement & montage → Livraison
Unités courantes : demi-journée, journée, forfait
Spécificités secteur : inclure droits de diffusion (web, print, TV, durée, territoire). Préciser les formats de livraison.`;
  }

  if (/\b(r(é|e)dac|copywriting|article|blog|seo|contenu|content|texte|editorial|newsletter|landing\s*page)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Rédaction & content marketing
Tarifs marché FR : article 600–1 000 mots → 80–180€, 1 000–1 500 mots → 120–280€, audit SEO 400–1 200€
Structure typique : Brief & recherche mots-clés → Rédaction → Révisions → Optimisation SEO & livraison
Unités courantes : article, forfait, mot
Spécificités secteur : préciser longueur minimale, délai de livraison, nb révisions incluses, interlocuteur SEO technique si besoin.`;
  }

  if (/\b(consultant|conseil|strat(é|e)gie|audit|diagnos|management|rh|ressources\s*humaines|organisat|coach\s*business)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Conseil & consulting
TJM marché FR : 700–1 800€/jour HT selon domaine et séniorité
Structure typique : Phase de découverte → Diagnostic / analyse → Recommandations & livrables → Suivi & implémentation
Unités courantes : jour, demi-journée, forfait
Spécificités secteur : chaque ligne doit avoir un livrable concret associé (rapport, présentation, roadmap). Acompte 30–50% à la commande.`;
  }

  if (/\b(formation|formateur|atelier|workshop|p(é|e)dagogie?|cours|e-learning|coach(?!ing\s*business)|coaching)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Formation & coaching
Tarifs marché FR : journée formation intra 800–2 500€, coaching exécutif 150–350€/heure, formation e-learning 1 500–5 000€
Structure typique : Ingénierie pédagogique → Animation → Support de formation → Évaluation & suivi post-formation
Unités courantes : jour, heure, forfait, stagiaire
Spécificités secteur : préciser intra/inter, nb participants, possibilité financement OPCO/CPF si applicable.`;
  }

  if (/\b(marketing|community|social\s*media|r(é|e)seaux\s*sociaux|facebook|instagram|linkedin|tiktok|campagne|ads|google\s*ads|meta|influence)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Marketing digital & community management
Tarifs marché FR : forfait CM mensuel 800–2 800€, gestion campagne ads 500–1 800€/mois, stratégie sociale 1 500–3 500€
Structure typique : Stratégie & calendrier éditorial → Création de contenu → Gestion & animation → Reporting mensuel
Unités courantes : forfait, mois, publication, campagne
Spécificités secteur : distinguer temps de création vs gestion vs reporting. Préciser les plateformes couvertes et la fréquence de publication.`;
  }

  if (/\b(traducteur|traduction|interpr(è|e)te|localisation|localization)\b/.test(b)) {
    return `SECTEUR DÉTECTÉ : Traduction & localisation
Tarifs marché FR : 0,07–0,15€/mot selon paire de langues et complexité, révision 0,04–0,08€/mot
Structure typique : Analyse du document → Traduction → Révision & relecture → Livraison
Unités courantes : mot, page, forfait
Spécificités secteur : préciser paire de langues, domaine spécialisé (juridique, médical, technique), délai, format de livraison.`;
  }

  return `SECTEUR : Prestations de service freelance généraliste
Prix de référence : adapte en fonction du niveau de complexité, du budget et du délai mentionnés dans le brief
Structure : décompose en phases ou livrables distincts
Unités courantes : forfait, jour, heure selon nature de la mission`;
}

/** Construit la section catalogue du prompt */
function buildCatalogSection(catalogItems: CatalogItemContext[], displayName: string): string {
  if (!catalogItems.length) return "";

  const fixed  = catalogItems.filter((i) => i.type === "fixed");
  const hourly = catalogItems.filter((i) => i.type === "hourly");

  let section = `\n\n=== CATALOGUE DE PRESTATIONS (VRAIS TARIFS DE ${displayName.toUpperCase()}) ===
Ces prix sont ses tarifs réels, utilise-les EN PRIORITÉ et ne les modifie pas.`;

  if (fixed.length > 0) {
    section += `\n\nFORFAITS / PRESTATIONS À L'ACTE :`;
    for (const item of fixed) {
      section += `\n  • ${item.name}`;
      if (item.description) section += ` (${item.description})`;
      section += ` → ${item.unit_price}€ / ${item.unit || "forfait"}`;
    }
  }

  if (hourly.length > 0) {
    section += `\n\nPRESTATIONS AU TAUX HORAIRE :`;
    for (const item of hourly) {
      section += `\n  • ${item.name}`;
      if (item.description) section += ` (${item.description})`;
      section += ` → ${item.unit_price}€/h`;
      section += ` (estime les heures selon le scope du brief ; total = heures × ${item.unit_price}€)`;
    }
  }

  section += `\n\nRÈGLE CATALOGUE : Utilise ces tarifs TELS QUELS (ne les arrondis pas, ne les change pas). Adapte uniquement les quantités. Si le projet nécessite une prestation absente du catalogue, ajoute-la avec un prix cohérent avec les tarifs existants.`;

  return section;
}

/** Construit le prompt système personnalisé */
function buildSystemPrompt(context: UserContext, brief?: string): string {
  const {
    name, company, tvaRegime, tvaRate,
    avgProjectTotal, avgDailyRate, avgItemCount,
    commonUnits, typicalPaymentTerms, recentProjects,
    catalogItems,
  } = context;

  const displayName = company || name || "ce freelance";
  const tvaLabel = tvaRegime ? (TVA_REGIME_LABELS[tvaRegime] ?? `TVA ${tvaRate}%`) : `TVA ${tvaRate}%`;

  // Section profil
  let profileSection = `PROFIL
Nom / entreprise : ${displayName}
Régime TVA : ${tvaLabel}`;

  if (avgDailyRate) {
    profileSection += `\nTJM habituel (déduit de ses devis) : ~${Math.round(avgDailyRate)}€/jour HT`;
  }
  if (avgProjectTotal) {
    profileSection += `\nMontant moyen de ses missions : ~${Math.round(avgProjectTotal)}€ HT`;
  }
  if (commonUnits.length > 0) {
    profileSection += `\nUnités qu'il utilise habituellement : ${commonUnits.join(", ")}`;
  }
  if (avgItemCount) {
    profileSection += `\nNombre moyen de lignes par devis : ~${Math.round(avgItemCount)}`;
  }
  if (typicalPaymentTerms) {
    profileSection += `\nSes conditions de paiement habituelles : "${typicalPaymentTerms}"`;
  }
  if (recentProjects.length > 0) {
    profileSection += `\nSes dernières missions : ${recentProjects.join(" | ")}`;
  }

  // Règle TVA
  const tvaNotes = tvaRate === 0
    ? `\nRÈGLE TVA ABSOLUE : ${displayName} est en franchise de TVA.
- tva_rate doit être 0
- total_ttc = total_ht (pas de TVA)
- Dans les notes, inclure OBLIGATOIREMENT : "TVA non applicable, art. 293 B du CGI"`
    : `\ntva_rate à utiliser : ${tvaRate}`;

  // Catalogue de prestations (vrais tarifs de l'utilisateur)
  const catalogSection = buildCatalogSection(catalogItems ?? [], displayName);

  // Intelligence sectorielle (si brief fourni)
  const sectorSection = brief ? `\n\n${detectSector(brief)}` : "";

  return `Tu es l'assistant devis personnel de ${displayName}.
Ta mission : générer un devis professionnel, précis et personnalisé qui ressemble à ce que ${displayName} ferait lui-même, pas un devis générique impersonnel.

=== ${profileSection}${catalogSection}${tvaNotes}${sectorSection}

=== RÈGLES DE GÉNÉRATION ===
1. PERSONNALISE : utilise les prix, unités et structure habituels de ${displayName}. Si pas d'historique, utilise les repères sectoriels ci-dessus.
2. BUDGET : si le brief mentionne un budget ou un prix cible, respecte-le en ajustant les quantités ou les prix, ne le dépasse jamais.
3. DÉCOMPOSE en 3 à 7 lignes logiques et distinctes (pas une seule ligne forfait générique)
4. PRIX PRÉCIS : évite les chiffres trop ronds (1000€, 2000€). Préfère 950€, 1 200€, 1 750€, 2 400€, ça fait plus réel et crédible.
5. CONDITIONS : si l'utilisateur a des conditions habituelles, reprends-les. Sinon : "Acompte 30% à la commande, solde à la livraison, Pénalités de retard : 3× taux légal"
6. NOTES : professionnelles, claires, ni trop longues ni trop formelles. Inclure validité + conditions résumées.
7. valid_days : 30 par défaut sauf indication contraire dans le brief.
8. RETOURNE UNIQUEMENT le JSON, sans markdown, sans texte avant ou après.

Format JSON exact à retourner :
{
  "title": "string, titre court ex: Devis - Création site vitrine",
  "items": [
    {
      "description": "string, description précise de la prestation (pas générique)",
      "quantity": number,
      "unit": "string, ex: jour, heure, forfait, article, page, mois",
      "unit_price": number,
      "total": number
    }
  ],
  "total_ht": number,
  "tva_rate": number,
  "total_ttc": number,
  "valid_days": number,
  "payment_terms": "string",
  "notes": "string"
}`;
}

/** Recalcule tous les totaux (safeguard contre les erreurs de l'IA) */
function recalcTotals(proposal: GeneratedProposal): GeneratedProposal {
  const items = proposal.items.map((item) => ({
    ...item,
    total: Math.round(item.quantity * item.unit_price * 100) / 100,
  }));
  const total_ht = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
  const total_ttc = Math.round(total_ht * (1 + (proposal.tva_rate ?? 0) / 100) * 100) / 100;
  return { ...proposal, items, total_ht, total_ttc };
}

/* ─────────────────────────────────────────────
   Fonctions exportées
───────────────────────────────────────────── */

/** Génère un devis à partir d'un brief + contexte utilisateur complet */
export async function generateProposalWithContext(
  brief: string,
  context: UserContext
): Promise<GeneratedProposal> {
  const systemPrompt = buildSystemPrompt(context, brief);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `BRIEF DU PROJET :\n\n${brief}\n\nGénère le devis complet en JSON.`,
      },
    ],
    temperature: 0.35,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("Réponse OpenAI vide");

  const parsed = JSON.parse(content) as GeneratedProposal;
  return recalcTotals(parsed);
}

/** Affine un devis existant selon une instruction en langage naturel */
export async function refineProposalWithContext(
  existing: GeneratedProposal,
  instruction: string,
  context: UserContext
): Promise<GeneratedProposal> {
  const displayName = context.company || context.name || "l'utilisateur";
  const systemPrompt = buildSystemPrompt(context);

  const userPrompt = `Tu travailles sur le devis actuel de ${displayName}.

DEVIS ACTUEL :
${JSON.stringify(existing, null, 2)}

MODIFICATION DEMANDÉE :
"${instruction}"

Applique cette modification intelligemment. Tu peux :
- Ajouter, supprimer ou modifier des lignes
- Ajuster les prix, quantités ou unités
- Modifier le titre, les notes ou les conditions de paiement
- Restructurer si nécessaire

RÈGLES IMPÉRATIVES :
- Conserve le tva_rate actuel (${existing.tva_rate})
- Recalcule total_ht et total_ttc après modification
- Retourne le devis COMPLET modifié (même format JSON, toutes les lignes)
- UNIQUEMENT le JSON, sans texte avant ou après`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("Réponse OpenAI vide");

  const parsed = JSON.parse(content) as GeneratedProposal;
  // Forcer le tva_rate de l'original (l'IA ne doit pas le changer)
  parsed.tva_rate = existing.tva_rate;
  return recalcTotals(parsed);
}

/** Rétrocompat, génération sans contexte */
export async function generateProposal(brief: string): Promise<GeneratedProposal> {
  return generateProposalWithContext(brief, {
    name: null, company: null, tvaRegime: null, tvaRate: 20,
    avgProjectTotal: null, avgDailyRate: null, avgItemCount: null,
    commonUnits: [], typicalPaymentTerms: null, recentProjects: [], plan: "free",
    catalogItems: [],
  });
}
