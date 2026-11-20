import { redirect } from "next/navigation";

/** Ancienne adresse : le plan de comptes vit désormais dans les paramètres du cabinet. */
export default function AncienneAdresseComptesFec() {
  redirect("/cabinet/parametres?vue=fec");
}
