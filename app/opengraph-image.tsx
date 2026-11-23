import { TAILLE, miniatureAccueil } from "@/lib/miniature";

export const alt = "Deviso : vos devis rédigés, vos factures conformes, vos relances envoyées";
export const size = TAILLE;
export const contentType = "image/png";

export default function Image() {
  return miniatureAccueil();
}
