import OpenAI from "openai";
import type { GeneratedProposal } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un expert en rédaction de devis professionnels français pour freelances et indépendants.

Ton rôle : à partir d'un brief décrivant une prestation, générer un devis structuré, professionnel et conforme aux usages français.

Règles importantes :
- Décompose le projet en lignes claires et détaillées (3 à 8 lignes maximum)
- Les prix sont en euros HT, réalistes par rapport au marché français
- Respecte la terminologie professionnelle française
- Inclus une note de bas de page avec les conditions de paiement et validité
- Le taux de TVA standard est 20% (sauf mention contraire dans le brief)
- Adapte le ton au secteur mentionné

Tu dois retourner UNIQUEMENT un JSON valide avec cette structure exacte, sans markdown, sans texte avant ou après :
{
  "title": "string — titre court du devis ex: Devis - Création site vitrine",
  "items": [
    {
      "description": "string — description détaillée de la prestation",
      "quantity": number,
      "unit": "string — ex: heure, jour, forfait, page, mois",
      "unit_price": number,
      "total": number
    }
  ],
  "total_ht": number,
  "tva_rate": number,
  "total_ttc": number,
  "valid_days": number,
  "payment_terms": "string — conditions de paiement",
  "notes": "string — notes et mentions légales"
}`;

export async function generateProposal(brief: string): Promise<GeneratedProposal> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Voici le brief du projet :\n\n${brief}\n\nGénère le devis complet en JSON.`,
      },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("Réponse OpenAI vide");

  const parsed = JSON.parse(content) as GeneratedProposal;

  // Recalcul des totaux pour éviter les erreurs de l'IA
  parsed.items = parsed.items.map((item) => ({
    ...item,
    total: Math.round(item.quantity * item.unit_price * 100) / 100,
  }));
  parsed.total_ht = Math.round(
    parsed.items.reduce((sum, i) => sum + i.total, 0) * 100
  ) / 100;
  parsed.total_ttc = Math.round(
    parsed.total_ht * (1 + parsed.tva_rate / 100) * 100
  ) / 100;

  return parsed;
}
