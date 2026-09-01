import { SUPERPDP_API } from "@/lib/superpdp";

/**
 * Valider une facture AVANT de la transmettre.
 *
 * Pourquoi ça existe. La spec le dit elle-même, dans la description du statut
 * `api:invalid` : « Error occurred before the invoice was sent to the external
 * access point. **Most of errors like that can be avoided by calling the
 * /validation_reports endpoint first** ». Deviso ne l'appelait pas : ses
 * utilisateurs découvraient un rejet en 400 brut, ou pire, un `api:invalid`
 * asynchrone des heures plus tard.
 *
 * Deux propriétés rendent cet appel précieux :
 *   1. `"security": []` — **aucune authentification**. On peut donc valider la
 *      facture d'un utilisateur non raccordé, ce que rien d'autre ne permet.
 *   2. Chaque `message` porte `location`, « location of error in the XML if
 *      available » : on peut désigner l'endroit fautif au lieu de dire « refusé ».
 *
 * Le rapport est structuré par validateur (`subreports[].validator`, par
 * exemple `PEPPOL-EN16931-UBL.xsl`), avec `checks_count`, `messages[]` et
 * `failures[]`.
 */

export type MessageValidation = { message: string; raw: string; location?: string };

export type RapportValidation = {
  valide: boolean;
  format: string | null;
  niveau: string | null;
  /** Les échecs, tous validateurs confondus, dans l'ordre où ils arrivent. */
  echecs: MessageValidation[];
  /** Renseigné quand la validation elle-même n'a pas pu avoir lieu. */
  indisponible?: string;
};

type ReponseBrute = {
  data?: {
    is_valid?: boolean;
    format?: string;
    conformance_level?: string;
    error?: string;
    subreports?: {
      validator?: string;
      failures?: MessageValidation[];
      messages?: MessageValidation[];
    }[];
  }[];
};

/**
 * Soumet un XML CII à la validation.
 *
 * Ne lève jamais : une validation indisponible ne doit pas empêcher d'émettre.
 * C'est un service de confort en amont, pas un verrou — le vrai verrou reste le
 * pré-contrôle synchrone de la plateforme au moment du POST.
 */
export async function validerFacture(
  xml: string,
  nomFichier = "facture.xml"
): Promise<RapportValidation> {
  try {
    const formulaire = new FormData();
    formulaire.append("file", new Blob([xml], { type: "application/xml" }), nomFichier);

    const res = await fetch(`${SUPERPDP_API}/validation_reports`, {
      method: "POST",
      body: formulaire,
    });

    if (!res.ok) {
      return { valide: true, format: null, niveau: null, echecs: [], indisponible: `HTTP ${res.status}` };
    }

    const corps = (await res.json()) as ReponseBrute;
    const rapport = corps.data?.[0];
    if (!rapport) {
      return { valide: true, format: null, niveau: null, echecs: [], indisponible: "Rapport vide" };
    }

    let echecs = (rapport.subreports ?? []).flatMap((sr) => sr.failures ?? []);

    // Un rapport peut déclarer la facture invalide sans remplir `failures`.
    //
    // Constaté le 01/09/2026 sur une facture B2BInt : `is_valid: false`,
    // `failures` vide, `error` absent. L'écran annonçait donc « cette facture
    // serait refusée » suivi d'une liste de raisons… vide. C'est le pire des
    // messages : il alarme sans permettre d'agir, et l'utilisateur n'a même pas
    // de quoi poser la question au support.
    //
    // Le schéma `subreport` porte DEUX tableaux — `failures` et `messages` —
    // et nous ne lisions que le premier. On se rabat donc sur le second quand
    // le verdict est négatif mais muet, et à défaut on le dit franchement
    // plutôt que d'afficher un vide.
    if (rapport.is_valid === false && echecs.length === 0) {
      const messages = (rapport.subreports ?? []).flatMap((sr) => sr.messages ?? []);
      echecs = messages.length
        ? messages
        : [
            {
              message:
                "La Plateforme Agréée déclare cette facture non conforme sans préciser la règle en cause. " +
                "Transmettez-la telle quelle : son contrôle au dépôt donnera le motif exact.",
              raw: JSON.stringify(rapport).slice(0, 500),
            },
          ];
    }

    return {
      // On ne se déclare invalide que si la plateforme le dit explicitement :
      // en cas de doute, on laisse passer et le POST tranchera.
      valide: rapport.is_valid !== false,
      format: rapport.format ?? null,
      niveau: rapport.conformance_level ?? null,
      echecs,
      ...(rapport.error ? { indisponible: rapport.error } : {}),
    };
  } catch (err) {
    return {
      valide: true,
      format: null,
      niveau: null,
      echecs: [],
      indisponible: err instanceof Error ? err.message : "Validation injoignable",
    };
  }
}

/** Met un rapport en phrases lisibles, sans jargon de validateur. */
export function resumerEchecs(echecs: MessageValidation[], maximum = 5): string[] {
  return echecs.slice(0, maximum).map((e) => {
    const ou = e.location ? ` (${e.location})` : "";
    return `${e.message}${ou}`;
  });
}
