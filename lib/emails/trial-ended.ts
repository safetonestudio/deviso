/**
 * Email envoyé le jour où l'essai se termine SANS carte enregistrée.
 *
 * Pendant de `trial-ending.ts` (J-3). Branché sur la fin d'essai reconnue par
 * `essaiTermineSansPaiement` (lib/fin-essai.ts), envoyé une seule fois par
 * titulaire. Email de compte (Deviso écrit au titulaire) : il porte donc le nom
 * Deviso. Le lien mène au tableau de bord, qui affiche l'écran « Ton essai est
 * terminé » avec le bouton d'ajout de carte.
 */

export const OBJET_ESSAI_TERMINE =
  "Ton essai Deviso est terminé · ajoute une carte pour continuer";

export function trialEndedEmailHtml(
  firstName: string,
  opts: { url: string; planLabel: string }
): string {
  const name = firstName?.split(" ")[0] || "là";
  const { url, planLabel } = opts;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ton essai Deviso est terminé</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4f46e5;border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:18px;">D</span>
                  </td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;color:#0f172a;">Deviso</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">
                Ton essai est terminé, ${name}
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Tes 14 jours d'essai de la formule ${planLabel} sont passés et aucune carte
                n'était enregistrée. Les fonctions ${planLabel} sont donc suspendues depuis
                aujourd'hui.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Rien n'a été supprimé : tes devis, tes factures et tes clients t'attendent,
                exactement où tu les as laissés.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                Pour reprendre, ajoute une carte en une minute. Tu choisis ta formule et ta
                facturation, mensuelle ou annuelle, et tu peux résilier à tout moment.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
                <tr>
                  <td style="background:#4f46e5;border-radius:10px;">
                    <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;">
                      Ajouter une carte
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 8px 0;text-align:center;font-size:13px;color:#94a3b8;line-height:1.6;">
              Tu reçois cet email parce que ton essai Deviso vient de se terminer.
              Une question ? Réponds simplement à ce message.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
