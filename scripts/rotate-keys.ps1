# Rotation guidee des cles exposees, une par une.
#
#   powershell -ExecutionPolicy Bypass -File scripts\rotate-keys.ps1
#
# Pourquoi ce script existe plutot que trois appels a set-secret.ps1 : les trois
# appels enchaines lisent le MEME presse-papiers si l'on oublie de copier entre
# deux. Ils echouent alors tous les trois de facon identique, et rien ne dit
# que la cause est la sequence et non la valeur. Ici, le script s'arrete avant
# chaque cle et refuse un presse-papiers qu'il a deja vu.
#
# La valeur n'est jamais affichee, ni ecrite dans l'historique du terminal.
#
# IMPORTANT : fichier volontairement ecrit sans aucun caractere accentue.
# Windows PowerShell 5.1 lit les .ps1 en ANSI : les accents y deviennent des
# octets parasites qui cassent les chaines.

$ErrorActionPreference = 'Stop'
$racine  = Resolve-Path (Join-Path $PSScriptRoot '..')
$fichier = Join-Path $racine '.env.local'
if (-not (Test-Path $fichier)) { throw "Fichier introuvable : $fichier" }

$CLES = @(
  @{ Nom = "RESEND_API_KEY"
     Ou  = "Resend -> API Keys -> la nouvelle cle 'Deviso app' (Sending access)"
     Forme = '^re_[A-Za-z0-9_\-]{20,}$' },
  @{ Nom = "RESEND_SMTP_FULL_KEY"
     Ou  = "Resend -> API Keys -> la nouvelle cle 'Supabase SMTP'"
     Forme = '^re_[A-Za-z0-9_\-]{20,}$' },
  @{ Nom = "SENTRY_AUTH_TOKEN"
     Ou  = "Sentry -> org selim-albert -> Auth Tokens -> le nouveau jeton"
     Forme = '^sntry[a-z]*_[A-Za-z0-9_\-]{20,}$' }
)

function Empreinte([string]$t) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($t)) | ForEach-Object { $_.ToString('x2') }) -join ''
}

# Decrit une ligne sans jamais la montrer : sa longueur et sa forme.
function Decrire([string]$l) {
  if ($l -match '\s')                       { return "$($l.Length) car., contient des espaces (du texte, pas une cle)" }
  if ($l -match '^re_[A-Za-z0-9_\-]+$')     { return "$($l.Length) car., forme d'une cle Resend" }
  if ($l -match '^sntry[a-z]*_')            { return "$($l.Length) car., forme d'un jeton Sentry" }
  return "$($l.Length) car., forme inconnue"
}

$vues = @{}   # empreinte -> nom de la cle deja enregistree avec cette valeur
$faites = @()
$passees = @()

Write-Host ""
Write-Host "Rotation des cles - trois valeurs, une par une."
Write-Host "La valeur ne s'affiche jamais. Entree pour valider, 'p' pour passer, Ctrl+C pour tout arreter."
Write-Host ""

foreach ($cle in $CLES) {
  $nom = $cle.Nom

  # Valeur actuelle, pour verifier que la cle a bien ete RENOUVELEE.
  $contenu = Get-Content $fichier -Raw
  $actuelle = [regex]::Match($contenu, "(?m)^" + [regex]::Escape($nom) + "=(.*)$").Groups[1].Value.Trim()

  while ($true) {
    Write-Host "--- $nom"
    Write-Host "    $($cle.Ou)"
    # Montrer ce qui est deja en place : c'est la seule facon de voir d'un coup
    # d'oeil qu'une cle a deja ete renouvelee dans cette session. Un
    # avertissement qui vit dans un message de conversation ne protege personne.
    if ($actuelle) {
      $apercu = $actuelle.Substring(0, [Math]::Min(12, $actuelle.Length))
      Write-Host "    Deja enregistree : $($actuelle.Length) car., commence par $apercu..."
    } else {
      Write-Host "    Rien d'enregistre pour l'instant."
    }
    $rep = Read-Host "    Copiez la valeur, puis Entree ('p' pour passer)"
    if ($rep -eq 'p') { $passees += $nom; Write-Host "    passee."; Write-Host ""; break }

    $brut = Get-Clipboard -Raw
    if ($null -eq $brut) { $brut = "" }
    $lignes = @($brut -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })

    if ($lignes.Count -eq 0) {
      Write-Host "    Le presse-papiers est vide. Copiez la cle puis reessayez." -ForegroundColor Yellow
      Write-Host ""
      continue
    }
    if ($lignes.Count -gt 1) {
      Write-Host "    Le presse-papiers contient $($lignes.Count) lignes :" -ForegroundColor Yellow
      $i = 1
      foreach ($l in $lignes) { Write-Host "      ligne $i : $(Decrire $l)"; $i++ }
      Write-Host "    Copiez uniquement la valeur, puis reessayez." -ForegroundColor Yellow
      Write-Host ""
      continue
    }

    $valeur = $lignes[0]
    $emp = Empreinte $valeur

    # Cas reellement survenu le 28/08/2026 : la 2e cle Resend a ete saisie a
    # l'invite de la 1re, ecrasant une cle deja posee. Les deux valeurs sont
    # differentes et bien formees : aucun controle precedent ne pouvait le voir.
    # Celui-ci le voit, parce qu'il regarde tout le fichier et pas seulement
    # la variable demandee.
    $ailleurs = $null
    foreach ($m in [regex]::Matches($contenu, "(?m)^([A-Z0-9_]+)=(.*)$")) {
      $autreNom = $m.Groups[1].Value
      $autreVal = $m.Groups[2].Value.Trim()
      if ($autreNom -ne $nom -and $autreVal -and (Empreinte $autreVal) -eq $emp) { $ailleurs = $autreNom; break }
    }
    if ($ailleurs) {
      Write-Host "    Cette valeur est deja enregistree sous $ailleurs." -ForegroundColor Yellow
      Write-Host "    Vous etes probablement en train de saisir la mauvaise cle a la mauvaise invite." -ForegroundColor Yellow
      Write-Host "    ('p' pour passer cette cle, ou copiez la bonne valeur.)"
      Write-Host ""
      continue
    }

    if ($vues.ContainsKey($emp)) {
      Write-Host "    Le presse-papiers n'a pas change depuis $($vues[$emp]). Copiez la cle suivante." -ForegroundColor Yellow
      Write-Host ""
      continue
    }
    if ($actuelle -and (Empreinte $actuelle) -eq $emp) {
      Write-Host "    C'est deja la valeur presente dans .env.local : cette cle n'a pas ete renouvelee." -ForegroundColor Yellow
      Write-Host "    (Si vous venez de l'enregistrer, tapez 'p' pour passer a la suivante.)"
      Write-Host ""
      continue
    }
    if ($valeur -notmatch $cle.Forme) {
      Write-Host "    Ce n'est pas la forme attendue - $(Decrire $valeur)." -ForegroundColor Yellow
      $forcer = Read-Host "    Enregistrer quand meme ? (o/N)"
      if ($forcer -ne 'o') { Write-Host ""; continue }
    }

    # Remplacer une valeur existante est une perte potentielle : on le demande
    # explicitement, et le defaut est NON.
    if ($actuelle) {
      $apercu = $actuelle.Substring(0, [Math]::Min(12, $actuelle.Length))
      Write-Host "    $nom contient deja une valeur ($apercu...)." -ForegroundColor Yellow
      $ok = Read-Host "    La remplacer ? (o/N)"
      if ($ok -ne 'o') { Write-Host "    Inchangee."; Write-Host ""; $passees += $nom; break }
    }

    # Ecriture : on delegue a set-secret.ps1, source unique de la mise a jour
    # de .env.local (sauvegarde horodatee, remplacement sur, effacement du
    # presse-papiers). Ne jamais reecrire cette logique ici.
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'set-secret.ps1') $nom -DepuisPressePapiers
    if ($LASTEXITCODE -ne 0) { throw "set-secret.ps1 a echoue pour $nom." }

    $vues[$emp] = $nom
    $faites += $nom
    Write-Host ""
    break
  }
}

Write-Host "==============================="
Write-Host "Enregistrees dans .env.local : $(if ($faites) { $faites -join ', ' } else { 'aucune' })"
if ($passees) { Write-Host "Passees : $($passees -join ', ')" }
Write-Host ""
Write-Host "Rappel : RESEND_SMTP_FULL_KEY sert de mot de passe SMTP dans Supabase"
Write-Host "(Auth -> Emails -> SMTP Settings) ; elle n'est pas posee sur Vercel."
Write-Host ""
Write-Host "Etape suivante, une fois RESEND_API_KEY et SENTRY_AUTH_TOKEN enregistrees :"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\push-secret.ps1 RESEND_API_KEY,SENTRY_AUTH_TOKEN"
