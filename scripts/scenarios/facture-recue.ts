/**
 * Banc d'essai : factures reçues fictives (lib/facture-recue-fictive.ts) et
 * contrôle de leur forme contre le schéma officiel de la plateforme.
 */
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
export { enInvoice, ligneSuperpdp, type FactureRecue, type LigneRecue } from "@/lib/facture-recue-fictive";

let valideur: ((x: unknown) => boolean) & { errors?: { instancePath: string; message?: string }[] | null };

/** Erreurs de forme par rapport au schéma `en_invoice` de la plateforme (vide = conforme). */
export function validerEnInvoice(en: unknown): string[] {
  if (!valideur) {
    const spec = JSON.parse(readFileSync(new URL("../../docs/superpdp/openapi.json", import.meta.url), "utf8"));
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addFormat("decimal", /^-?\d+(\.\d+)?$/);
    ajv.addSchema({ $id: "superpdp", components: spec.components });
    valideur = ajv.getSchema("superpdp#/components/schemas/en_invoice") as typeof valideur;
  }
  return valideur(en) ? [] : (valideur.errors ?? []).map((e) => `${e.instancePath || "(racine)"} ${e.message ?? ""}`);
}
