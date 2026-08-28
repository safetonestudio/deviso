# Gabarits d'emails d'authentification Supabase

Ces fichiers sont la **source de vérité** de gabarits qui, sinon, n'existeraient que
dans le tableau de bord Supabase — invisibles à la relecture, absents de Git, perdus
au premier changement de projet.

Ils ne sont lus par aucun code. Ils se collent à la main dans
**Authentication → Emails → Templates**, avec l'objet indiqué en tête de chaque fichier.

## Pourquoi ils existent (28/08/2026)

L'email de réinitialisation partait avec le **gabarit par défaut de Supabase** et
atterrissait dans les spams de Gmail, motif affiché : *« similar to messages that were
identified as spam in the past »*.

Ce n'était **pas** un problème d'authentification — SPF, DKIM et DMARC sont en place et
corrects, et les quatre emails applicatifs (devis, facture, relances) arrivent en boîte
de réception. C'était le contenu : anglais sur un produit français, aucune marque, et la
structure exacte du hameçonnage le plus courant (titre générique, lien nu, « if you didn't
request this »).

## Périmètre : deux gabarits sur douze

Le code n'appelle que `signUp` et `resetPasswordForEmail`. Les invitations d'équipe
partent de l'application via `lib/emails/invite.ts` et Resend, **pas** de Supabase.
Les dix autres gabarits ne sont jamais déclenchés — les réécrire serait du travail mort.

⚠️ Si un jour on ajoute `signInWithOtp` (lien magique) ou un changement d'adresse email,
il faudra traiter le gabarit correspondant : il repartira sinon en anglais par défaut.

## Ce que ces gabarits ne règlent pas

- `getdeviso.fr` n'a **aucun enregistrement MX** : le domaine expéditeur ne peut pas
  recevoir d'email, ce que Gmail et Microsoft comptent comme signal négatif.
- DMARC est en `p=none` : politique déclarée mais non appliquée.
- Le domaine a deux mois et presque aucun volume. Ça se répare par l'usage.
