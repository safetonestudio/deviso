# Pousse vers Vercel une valeur deja posee dans .env.local, sans jamais l'afficher.
#
#   powershell -ExecutionPolicy Bypass -File scripts\push-secret.ps1 RESEND_API_KEY
#   powershell -ExecutionPolicy Bypass -File scripts\push-secret.ps1 RESEND_API_KEY,SENTRY_AUTH_TOKEN
#
# ATTENTION : separateur VIRGULE, sans espace. Avec -File, un espace ferait
# passer le deuxieme nom pour l'environnement ("Invalid environment"), et
# PowerShell ne decoupe pas de lui-meme sur la virgule -- le script s'en
# charge. Les deux erreurs ont ete commises le 28/08/2026.
#
# Compagnon de set-secret.ps1 : celui-la ecrit dans .env.local, celui-ci recopie
# vers Vercel. La valeur ne transite ni par l'ecran, ni par l'historique du
# terminal, ni par une conversation.
#
# Pourquoi une redirection de fichier et non un pipe : sous Windows,
# `echo valeur | vercel env add` ajoute un espace final (la CLI previent
# "Value ends with whitespace"). SUPERPDP_SANDBOX avait ete posee ainsi et
# valait "true " au lieu de "true". Le fichier temporaire est ecrit avec
# -NoNewline, donc octet pour octet.
#
# IMPORTANT : fichier volontairement ecrit sans aucun caractere accentue.
# Windows PowerShell 5.1 lit les .ps1 en ANSI : les accents y deviennent des
# octets parasites qui cassent les chaines.

param(
  [Parameter(Mandatory = $true)][string[]]$Noms,
  [string]$Environnement = 'production',
  [int]$LongueurMinimale = 20
)

$ErrorActionPreference = 'Stop'

# Passage d'arguments sous -File : les deux formes echouent, differemment.
#   ... push-secret.ps1 A,B   -> PowerShell ne decoupe pas : $Noms = @("A,B")
#   ... push-secret.ps1 A B   -> B est pris pour l'ENVIRONNEMENT
# Les deux ont ete commises le 28/08/2026. On rattrape la premiere ici, et on
# refuse la seconde par un message explicite plutot que par une erreur de la
# CLI Vercel dix lignes plus loin.
$Noms = @($Noms | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

$environnementsValides = @('production', 'preview', 'development')
if ($environnementsValides -notcontains $Environnement) {
  throw "Environnement inconnu : '$Environnement'. Attendu : $($environnementsValides -join ', '). Si vous vouliez passer plusieurs variables, separez-les par une VIRGULE sans espace : RESEND_API_KEY,SENTRY_AUTH_TOKEN"
}

$racine  = Resolve-Path (Join-Path $PSScriptRoot '..')
$fichier = Join-Path $racine '.env.local'

if (-not (Test-Path $fichier)) { throw "Fichier introuvable : $fichier" }
$contenu = Get-Content $fichier -Raw

function Empreinte([string]$texte) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $oct = [System.Text.Encoding]::UTF8.GetBytes($texte)
  ($sha.ComputeHash($oct) | ForEach-Object { $_.ToString('x2') }) -join ''
}

foreach ($nom in $Noms) {
  Write-Host ""
  Write-Host "=== $nom ==="

  $m = [regex]::Match($contenu, "(?m)^" + [regex]::Escape($nom) + "=(.*)$")
  if (-not $m.Success) { throw "$nom absente de .env.local. Poser d'abord avec set-secret.ps1." }

  $valeur = $m.Groups[1].Value.Trim()
  if ([string]::IsNullOrWhiteSpace($valeur)) { throw "$nom vide dans .env.local." }
  if ($valeur.Length -lt $LongueurMinimale) {
    throw "$nom fait $($valeur.Length) caractere(s), moins que le minimum attendu ($LongueurMinimale). Collage probablement rate. Rien n'a ete pousse."
  }

  $tmp = Join-Path $env:TEMP ("dv-" + [guid]::NewGuid().ToString('N') + ".txt")
  try {
    # -NoNewline : pas d'octet parasite en fin de valeur.
    [System.IO.File]::WriteAllText($tmp, $valeur, (New-Object System.Text.UTF8Encoding($false)))

    Push-Location $racine
    # La CLI Vercel ecrit son bandeau ("Vercel CLI x.y.z") sur stderr. Avec
    # ErrorActionPreference = Stop, PowerShell en fait une erreur fatale : la
    # v1 s'interrompait ENTRE le rm et le add, laissant la variable supprimee
    # en production. Defaut reellement provoque le 28/08/2026. On relache la
    # preference le temps des appels, et on lit les codes de sortie a la main.
    $ancien = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      # rm tolere l'absence : on ne veut pas echouer sur une variable jamais posee.
      cmd /c "npx vercel env rm $nom $Environnement --yes" 2>&1 | Out-Null
      $sortie = cmd /c "npx vercel env add $nom $Environnement < `"$tmp`"" 2>&1
      $code = $LASTEXITCODE
      if ($code -ne 0) { throw "vercel env add a echoue pour $nom (code $code) : $sortie" }
      if ($sortie -match 'whitespace') { throw "Vercel signale un espace parasite sur $nom. Rien de fiable n'a ete pose." }
      Write-Host "Pousse sur $Environnement ($($valeur.Length) caracteres)."
    } finally {
      $ErrorActionPreference = $ancien
      Pop-Location
    }
  } finally {
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
  }
}

# Verification de ce qui est reellement verifiable.
#
# La v1 relisait les valeurs avec 'vercel env pull' et comparait les empreintes.
# Cela ne marche PAS : les variables du projet sont marquees "Sensitive", et
# Vercel renvoie alors la chaine "[SENSITIVE]" a la place de la valeur. Le
# script aurait annonce "DIFFERENTES" a chaque fois, donc un faux echec
# systematique. Constate le 22/08/2026 avant de s'en servir.
#
# Ce qui reste verifiable ici : que la variable EXISTE cote Vercel et que sa
# date de mise a jour est celle de maintenant. C'est une preuve de pose, pas
# une preuve de valeur.
#
# ATTENTION : La seule preuve de valeur est un usage reel apres redeploiement : un email
# reellement envoye, un evenement reellement recu par Sentry. Ne jamais dire
# qu'une cle est bonne avant ca.
Write-Host ""
Write-Host "=== Etat cote Vercel ==="
Push-Location $racine
try {
  $ancien = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try   { $liste = cmd /c "npx vercel env ls $Environnement" 2>&1 }
  finally { $ErrorActionPreference = $ancien }
} finally { Pop-Location }

foreach ($nom in $Noms) {
  $ligne = $liste | Where-Object { $_ -match ("^\s*" + [regex]::Escape($nom) + "\s") }
  if ($ligne) { Write-Host ("{0,-24} presente -> {1}" -f $nom, ($ligne -replace '\s+', ' ').Trim()) }
  else        { Write-Host ("{0,-24} ABSENTE cote Vercel." -f $nom) }
}

Write-Host ""
Write-Host "Pose confirmee, valeur NON verifiee (Vercel ne relit pas une variable Sensitive)."
Write-Host "Redeployer, puis traverser un envoi reel avant de conclure quoi que ce soit."
