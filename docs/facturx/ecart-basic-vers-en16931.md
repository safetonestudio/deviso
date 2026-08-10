# Factur-X : écart entre l'implémentation actuelle (BASIC) et EN 16931

Analyse réalisée le 13/07/2026 en soumettant le XML réellement produit par `lib/invoice-xml.ts` au validateur officiel de Super PDP (`POST https://api.superpdp.tech/v1.beta/validation_reports`), puis en corrigeant les erreurs une par une jusqu'à obtenir un document valide.

**Résultat de référence** : `docs/facturx/reference-en16931-valide.xml` → `is_valid: true`, 189 contrôles, 0 échec, 0 avertissement.

## Constat de départ : le profil BASIC n'est pas validable

Le XML actuel est détecté comme `urn:factur-x.eu:1p0:basic` et le validateur répond :

> **« Aucun validateur de trouvé pour ce format de fichier »**

Les profils Factur-X couverts par les validateurs de la réforme sont :

| Profil | Statut |
|---|---|
| BASIC | ❌ Aucun validateur — hors périmètre réforme |
| BASICWL | ⚠️ Déconseillé, toléré uniquement au démarrage |
| **EN 16931 (Comfort)** | ✅ **Conseillé — c'est la cible** |
| EXTENDED | ✅ Accepté |

Autrement dit : les factures générées aujourd'hui par Deviso ne passeraient pas la validation d'une Plateforme Agréée. Ce n'est pas bloquant avant l'obligation d'émission (septembre 2027), mais c'est le chantier à planifier.

## Les 9 corrections nécessaires

Chacune a été vérifiée empiriquement contre le validateur.

### 1. Profil déclaré
`urn:factur-x.eu:1p0:basic` → **`urn:cen.eu:en16931:2017`**

### 2. Erreur XSD : ordre des éléments (bug présent aujourd'hui)
Dans `SpecifiedTradePaymentTerms`, `ram:Description` doit précéder `ram:DueDateDateTime`. L'ordre actuel est inversé → **échec de validation XSD**, y compris en BASIC.

### 3. BT-23 — Mode de facturation (nouveau bloc)
Ajouter dans `ExchangedDocumentContext`, avant le profil :
```xml
<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>B1</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
```
Valeurs autorisées : B1, S1, M1, B2, S2, M2, S3, B4, S4, M4, S5, S6, B7, S7, B8, S8, M8, B9, S9, M9.

### 4. BR-FR-05 — Trois mentions légales obligatoires en notes (BG-1)
Codes `SubjectCode` requis : **PMT** (frais de recouvrement), **PMD** (pénalités de retard), **AAB** (escompte ou son absence). Le texte existe déjà dans le PDF ; il doit aussi être structuré dans le XML.

### 5. BR-FR-10 / BR-FR-32 — SIREN, pas SIRET ⚠️
`schemeID="0002"` exige **exactement 9 chiffres**. Deviso stocke aujourd'hui un SIRET (14 chiffres) dans `seller_siren` → rejet.
Correction : tronquer aux 9 premiers chiffres pour l'identifiant légal, et conserver le SIRET pour l'affichage PDF.

### 6. BT-34 / BT-49 — Adresses électroniques de facturation (obligatoires)
À ajouter dans `SellerTradeParty` et `BuyerTradeParty`, **après** `PostalTradeAddress` et **avant** `SpecifiedTaxRegistration` :
```xml
<ram:URIUniversalCommunication><ram:URIID schemeID="0225">SIREN</ram:URIID></ram:URIUniversalCommunication>
```
C'est l'adresse d'acheminement Peppol/DGFiP. **Impact produit** : il faut collecter le SIREN du client, aujourd'hui optionnel dans Deviso.

### 7. BR-S-02 — N° TVA vendeur obligatoire si TVA standard
Si une ligne est en catégorie `S`, `SpecifiedTaxRegistration schemeID="VA"` est obligatoire. **Impact produit** : le champ `tva_number` doit devenir obligatoire pour les profils assujettis.

### 8. Adresses postales complètes
`PostcodeCode` + `CityName` + `CountryID` sont requis. Deviso ne stocke aujourd'hui qu'une `address` en texte libre → il faut éclater le champ (rue / CP / ville).

### 9. PEPPOL-EN16931-R008 — Pas d'éléments vides
`<ram:ApplicableHeaderTradeDelivery/>` doit être rempli, par exemple avec la date de livraison :
```xml
<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">AAAAMMJJ</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>
```

## Charge de travail estimée

| Lot | Effort |
|---|---|
| Réécriture `lib/invoice-xml.ts` (points 1-4, 6, 9) | 2 j |
| Migration DB + UI : SIREN client, TVA obligatoire, adresses structurées (5, 7, 8) | 2-3 j |
| Tests de non-régression contre le validateur | 1 j |
| **Total** | **5-6 j** |

Les points 5, 7 et 8 sont les plus coûteux : ce ne sont pas des corrections XML mais des changements de modèle de données et de formulaires.

## Méthode de test réutilisable

Le validateur est public, gratuit et sans authentification :
```bash
curl -X POST https://api.superpdp.tech/v1.beta/validation_reports -F "file=@facture.xml"
```
Réponse : `is_valid`, `conformance_level`, `subreports[].failures` (bloquants) et `subreports[].messages` (avertissements).

À intégrer en test automatisé une fois la migration faite.
