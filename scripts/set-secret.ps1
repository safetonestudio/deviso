# Ecrit une valeur secrete dans .env.local sans qu'elle apparaisse a l'ecran,
# dans l'historique du terminal, ni dans aucune conversation.
#
# Deux modes :
#
#   1. Presse-papiers (recommande) - copiez la cle, puis :
#        powershell -ExecutionPolicy Bypass -File scripts\set-secret.ps1 SUPABASE_SERVICE_ROLE_KEY -DepuisPressePapiers
#
#   2. Saisie manuelle - a n'utiliser que si le presse-papiers est indisponible :
#        powershell -ExecutionPolicy Bypass -File scripts\set-secret.ps1 SUPABASE_SERVICE_ROLE_KEY
#
# Le mode presse-papiers existe parce que coller dans une invite masquee echoue
# silencieusement sur beaucoup de consoles Windows : le clic droit ne colle que
# si QuickEdit est actif, et rien ne signale l'echec. Une seule frappe passe, et
# la valeur enregistree est fausse sans que l'on comprenne pourquoi.
#
# IMPORTANT : fichier volontairement ecrit sans aucun caractere accentue.
# Windows PowerShell 5.1 lit les .ps1 en ANSI et non en UTF-8 : les accents y
# deviennent des octets parasites qui cassent les chaines de caracteres.

param(
  [Parameter(Mandatory = $true)][string]$Nom,
  [switch]$DepuisPressePapiers,
  # Longueur minimale attendue. Une cle Supabase, Stripe ou Resend depasse
  # largement ce seuil : en dessous, c'est un collage rate, pas une vraie valeur.
  [int]$LongueurMinimale = 20
)

$ErrorActionPreference = 'Stop'
$fichier = Join-Path $PSScriptRoot '..\.env.local'

if (-not (Test-Path $fichier)) { throw "Fichier introuvable : $fichier" }

if ($DepuisPressePapiers) {
  $valeur = (Get-Clipboard -Raw)
  if ($null -ne $valeur) { $valeur = $valeur.Trim() }
  Write-Host "Lecture depuis le presse-papiers."
} else {
  $secure = Read-Host -Prompt "Collez la valeur de $Nom (la saisie reste invisible)" -AsSecureString
  $bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $valeur = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim()
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if ([string]::IsNullOrWhiteSpace($valeur)) {
  throw "Valeur vide. Rien n'a ete modifie."
}

# Garde-fou : c'est l'absence de ce controle qui a laisse enregistrer un seul
# caractere sans que rien ne l'empeche.
if ($valeur.Length -lt $LongueurMinimale) {
  throw "Valeur de $($valeur.Length) caractere(s), soit moins que le minimum attendu ($LongueurMinimale). Le collage a probablement echoue. Rien n'a ete modifie."
}

if ($valeur -match "[`r`n]") {
  throw "La valeur contient un retour a la ligne : le collage a pris plusieurs lignes. Rien n'a ete modifie."
}

$sauvegarde = "$fichier.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
Copy-Item $fichier $sauvegarde -Force

$contenu = Get-Content $fichier -Raw
$ligne   = "$Nom=$valeur"
$motif   = "(?m)^" + [regex]::Escape($Nom) + "=.*$"

if ($contenu -match $motif) {
  # MatchEvaluator plutot qu'un remplacement direct : la valeur peut contenir
  # des caracteres que .NET interpreterait comme des references de groupe.
  $ev = [System.Text.RegularExpressions.MatchEvaluator] { param($m) $ligne }
  $contenu = [regex]::Replace($contenu, $motif, $ev)
} else {
  $contenu = $contenu.TrimEnd() + "`r`n" + $ligne + "`r`n"
}

Set-Content -Path $fichier -Value $contenu -NoNewline

# On ne reaffiche jamais la valeur : seulement de quoi verifier qu'elle est posee.
$pose  = (Select-String -Path $fichier -Pattern ("^" + [regex]::Escape($Nom) + "=(.+)$")).Matches[0].Groups[1].Value
$debut = $pose.Substring(0, [Math]::Min(12, $pose.Length))
Write-Host ""
Write-Host "$Nom enregistree : $($pose.Length) caracteres, commence par $debut..."
Write-Host "Sauvegarde du fichier precedent : $(Split-Path $sauvegarde -Leaf)"

if ($DepuisPressePapiers) {
  Set-Clipboard -Value " "
  Write-Host "Presse-papiers efface."
}
