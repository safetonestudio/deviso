export function welcomeEmailHtml(firstName: string): string {
  const name = firstName?.split(" ")[0] || "là";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Deviso</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
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

          <!-- Card -->
          <tr>
            <td style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 40px 32px;">

              <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">
                Bienvenue ${name} 👋
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Ton compte Deviso est actif. Tu peux maintenant créer des devis professionnels en quelques secondes grâce à l'IA — et les envoyer à tes clients pour signature.
              </p>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:18px;">⚡</span>
                    <span style="font-size:14px;color:#0f172a;font-weight:600;margin-left:10px;">Devis généré par IA en 30 secondes</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:18px;">✍️</span>
                    <span style="font-size:14px;color:#0f172a;font-weight:600;margin-left:10px;">Signature client en ligne intégrée</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="font-size:18px;">🧾</span>
                    <span style="font-size:14px;color:#0f172a;font-weight:600;margin-left:10px;">Factures Factur-X conformes 2026/2027</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://getdeviso.fr/dashboard"
                       style="display:inline-block;background:#4f46e5;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Créer mon premier devis →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Tu reçois cet email car tu viens de créer un compte sur
                <a href="https://getdeviso.fr" style="color:#4f46e5;text-decoration:none;">getdeviso.fr</a>.<br/>
                Des questions ? Réponds directement à cet email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
