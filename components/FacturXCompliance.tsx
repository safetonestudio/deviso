"use client";

import Link from "next/link";
import { checkInvoiceCompliance } from "@/lib/facturx-helpers";
import type { Invoice } from "@/types";
import { resolveAddress } from "@/lib/address";

/**
 * Diagnostic de conformité Factur-X EN 16931 affiché sur la facture.
 *
 * Rien n'est bloquant : la facture reste téléchargeable et envoyable. Mais dès
 * qu'un élément exigé par la norme manque, l'utilisateur doit le savoir AVANT
 * que sa Plateforme Agréée ne rejette le document.
 */
export function FacturXCompliance({ invoice }: { invoice: Invoice }) {
  const issues = checkInvoiceCompliance({
    sellerSiren: invoice.seller_siren,
    // On donne au contrôle la forme canonique issue des champs séparés : sinon
    // il rejugeait un texte libre et pouvait signaler un code postal manquant
    // alors qu'il était bien saisi, juste écrit autrement.
    sellerAddress: resolveAddress(
      { street: invoice.seller_street, postcode: invoice.seller_postcode, city: invoice.seller_city },
      invoice.seller_address
    ).formatted,
    sellerVatNumber: invoice.seller_tva_number,
    clientSiren: invoice.client_siren,
    clientAddress: resolveAddress(
      { street: invoice.client_street, postcode: invoice.client_postcode, city: invoice.client_city },
      invoice.client_address
    ).formatted,
    isFranchise: invoice.tva_rate === 0,
    // Heuristique provisoire : sans raison sociale, le client est un particulier.
    // Les obligations d'adressage (SIREN, adresse structurée) ne valent qu'en B2B —
    // les réclamer à un freelance qui facture des particuliers afficherait une
    // alerte rouge permanente et fausse. À remplacer par un vrai indicateur B2C
    // sur la facture quand on traitera l'e-reporting (étape 5 du plan Super PDP).
    isB2C: !invoice.client_company?.trim(),
  });

  const blocking = issues.filter((i) => i.blocking);
  const warnings = issues.filter((i) => !i.blocking);

  if (!issues.length) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <span className="mt-0.5 text-emerald-400 shrink-0" aria-hidden="true">✓</span>
        <div className="text-sm">
          <p className="font-medium text-emerald-300">Facture conforme Factur-X EN 16931</p>
          <p className="text-emerald-400/70 text-xs mt-0.5">
            Toutes les données exigées par la réforme 2026 sont présentes.
          </p>
        </div>
      </div>
    );
  }

  const isBlocking = blocking.length > 0;

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        isBlocking
          ? "border-amber-500/25 bg-amber-500/10"
          : "border-ds-border bg-ds-elevated"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 ${isBlocking ? "text-amber-400" : "text-gray-500"}`} aria-hidden="true">
          {isBlocking ? "!" : "i"}
        </span>
        <div className="text-sm min-w-0">
          <p className={`font-medium ${isBlocking ? "text-amber-300" : "text-gray-300"}`}>
            {isBlocking
              ? "Cette facture serait refusée par une plateforme de facturation électronique"
              : "Conformité Factur-X : à vérifier"}
          </p>
          <ul className="mt-2 space-y-1">
            {blocking.map((i) => (
              // Pas d'opacité ici : les surcharges thème clair de globals.css sont
              // une liste blanche de noms de classes exacts. `text-amber-200/80`
              // n'y figurait pas et restait en jaune pâle, illisible sur fond clair.
              <li key={i.field} className="text-amber-200 text-xs flex gap-1.5">
                <span aria-hidden="true">•</span>
                <span>{i.label}</span>
              </li>
            ))}
            {warnings.map((i) => (
              <li key={i.field} className="text-gray-400 text-xs flex gap-1.5">
                <span aria-hidden="true">•</span>
                <span>{i.label}</span>
              </li>
            ))}
          </ul>
          {/* Le lien doit pointer là où la donnée se corrige. Renvoyer vers le profil
              pour un SIREN client manquant envoyait l'utilisateur au mauvais endroit. */}
          <p className="mt-2.5 text-xs text-gray-500">
            L&apos;obligation d&apos;émettre des factures électroniques s&apos;applique aux TPE
            à partir de septembre 2027.{" "}
            {issues.some((i) => i.field.startsWith("seller") || i.field === "tva_number") && (
              <Link href="/profil" className="text-indigo-400 hover:text-indigo-300 underline">
                Compléter mon profil
              </Link>
            )}
            {issues.some((i) => i.field.startsWith("client")) && (
              <span className="block mt-1">
                Les informations du client se saisissent à la création de la facture.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
