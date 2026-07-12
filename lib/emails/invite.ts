export function inviteEmailHtml(ownerName: string, ownerCompany: string, inviteUrl: string): string {
  const from = ownerCompany || ownerName || "un utilisateur Deviso";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Invitation Deviso</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#4f46e5;border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-weight:700;font-size:18px;">D</span>
            </td>
            <td style="padding-left:10px;font-size:20px;font-weight:700;color:#0f172a;">Deviso</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Tu es invité(e) à rejoindre une équipe 👋</p>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
            <strong style="color:#0f172a;">${from}</strong> t'invite à rejoindre son espace de travail sur Deviso.
            Tu auras accès aux devis, factures et outils de l'équipe.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:10px;">
              Accepter l'invitation →
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
            Ce lien est valable 7 jours. Si tu n'attendais pas cette invitation, ignore cet email.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="https://getdeviso.fr" style="color:#4f46e5;text-decoration:none;">getdeviso.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
