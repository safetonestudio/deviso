import { TAILLE, miniatureAccueil } from "@/lib/miniature";

export const alt = "Deviso : tes devis rédigés, tes factures conformes, tes relances envoyées";
export const size = TAILLE;
export const contentType = "image/png";

export default function Image() {
  return miniatureAccueil();
}
