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

# Le presse-papiers de Windows rapporte souvent des lignes vides autour de la
# valeur : bouton "copier" d'une page web, selection qui deborde d'un cran, ou
# simple retour a la ligne final. La v1 refusait tout, y compris ces cas ou la
# valeur est parfaitement lisible. On ignore donc les lignes VIDES, et on ne
# refuse que s'il reste vraiment plusieurs lignes porteuses de texte -- la, on
# ne peut pas deviner laquelle est la cle.
$lignes = @($valeur -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })

if ($lignes.Count -eq 0) {
  throw "Le presse-papiers ne contient aucun texte. Rien n'a ete modifie."
}

if ($lignes.Count -gt 1) {
  # Diagnostic sans jamais afficher le contenu : seulement les longueurs.
  $detail = ($lignes | ForEach-Object { "$($_.Length) car." }) -join ", "
  throw "Le presse-papiers contient $($lignes.Count) lignes de texte ($detail). Impossible de deviner laquelle est la cle : recopiez uniquement la valeur. Rien n'a ete modifie."
}

$valeur = $lignes[0]

# Le controle de longueur ci-dessus portait sur la valeur brute, lignes vides
# comprises. On le rejoue sur ce qui sera reellement enregistre.
if ($valeur.Length -lt $LongueurMinimale) {
  throw "Apres nettoyage, la valeur ne fait que $($valeur.Length) caractere(s), moins que le minimum attendu ($LongueurMinimale). Rien n'a ete modifie."
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
  # Windows refuse parfois l'acces au presse-papiers quand un autre programme
  # le tient verrouille. C'est une commodite, pas l'objet du script : elle ne
  # doit jamais faire echouer une ecriture qui a REUSSI. La v1 le faisait, et
  # rotate-keys.ps1 s'arretait alors que la cle etait posee (22/08/2026).
  try {
    Set-Clipboard -Value " " -ErrorAction Stop
    Write-Host "Presse-papiers efface."
  } catch {
    Write-Host "Presse-papiers NON efface (Windows l'a refuse) - la valeur y est encore."
    Write-Host "Sans importance pour l'enregistrement, qui a bien eu lieu."
  }
}
