/**
 * Email de relance envoye 3 jours avant la fin de l'essai, uniquement quand
 * aucun moyen de paiement n'est enregistre (sinon le client sera preleve
 * normalement et n'a pas besoin d'etre relance).
 *
 * Branche sur l'evenement Stripe `customer.subscription.trial_will_end`.
 * Email de compte (Deviso ecrit au titulaire), pas un email client : il porte
 * donc le nom Deviso et un lien vers l'espace de facturation.
 */
export function trialEndingEmailHtml(
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
  <title>Ton essai Deviso se termine bientôt</title>
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
                Ton essai se termine dans 3 jours, ${name}
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Ton essai de la formule ${planLabel} arrive à son terme. Aucune carte n'est
                enregistrée pour l'instant : sans moyen de paiement, ton accès repassera
                automatiquement à la formule gratuite et tu perdras les fonctions ${planLabel}.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                Pour continuer sans interruption, ajoute une carte en une minute. Tu ne seras
                débité qu'à la fin de l'essai, et tu peux résilier à tout moment.
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
              Tu reçois cet email parce que tu as un essai en cours sur Deviso.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
