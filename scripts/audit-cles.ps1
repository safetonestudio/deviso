# Compare ce que Vercel a en production avec ce que .env.local contient,
# sans jamais afficher une valeur complete : seulement les 10 premiers
# caracteres, qui sont deja visibles dans le tableau de bord Resend.
#
#   powershell -ExecutionPolicy Bypass -File scripts\audit-cles.ps1
#
# Ecrit sans accent : Windows PowerShell 5.1 lit les .ps1 en ANSI.

$ErrorActionPreference = 'Stop'
$racine = Resolve-Path (Join-Path $PSScriptRoot '..')
$local  = Join-Path $racine '.env.local'
$pull   = Join-Path $env:TEMP ("dv-audit-" + [guid]::NewGuid().ToString('N') + ".env")

function Extrait([string]$contenu, [string]$nom) {
  $m = [regex]::Match($contenu, "(?m)^" + [regex]::Escape($nom) + "=(.*)$")
  if (-not $m.Success) { return $null }
  return $m.Groups[1].Value.Trim().Trim('"')
}

function Empreinte([string]$t) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  (($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($t)) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 8)
}

try {
  Push-Location $racine
  # npx ecrit ses avertissements sur stderr ; avec ErrorActionPreference=Stop,
  # PowerShell les traite comme une erreur fatale. On relache le temps de l appel.
  $ancien = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try   { cmd /c "npx vercel env pull `"$pull`" --environment=production --yes" 2>&1 | Out-Null }
  finally {
    $ErrorActionPreference = $ancien
    Pop-Location
  }
  if (-not (Test-Path $pull)) { throw "vercel env pull n'a rien ecrit." }

  $cLocal   = Get-Content $local -Raw
  $cDistant = Get-Content $pull  -Raw

  "{0,-24} {1,-16} {2,-16} {3}" -f "VARIABLE", "LOCAL", "VERCEL PROD", "VERDICT"
  "-" * 74

  foreach ($nom in @("RESEND_API_KEY", "RESEND_SMTP_FULL_KEY", "SENTRY_AUTH_TOKEN", "NEXT_PUBLIC_SENTRY_DSN")) {
    $a = Extrait $cLocal   $nom
    $b = Extrait $cDistant $nom
    $pa = if ($a) { $a.Substring(0, [Math]::Min(10, $a.Length)) + "..." } else { "absente" }
    $pb = if ($b) { $b.Substring(0, [Math]::Min(10, $b.Length)) + "..." } else { "absente" }
    if     (-not $a -and -not $b) { $v = "nulle part" }
    elseif (-not $b)              { $v = "PAS sur Vercel" }
    elseif (-not $a)              { $v = "PAS en local" }
    elseif ((Empreinte $a) -eq (Empreinte $b)) { $v = "identiques" }
    else                          { $v = "DIFFERENTES" }
    "{0,-24} {1,-16} {2,-16} {3}" -f $nom, $pa, $pb, $v
  }
}
finally {
  if (Test-Path $pull) { Remove-Item $pull -Force }
}

""
"Fichier temporaire supprime. Aucune valeur complete n'a ete affichee."
