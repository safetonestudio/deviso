import { TAILLE, miniatureCabinet } from "@/lib/miniature";

export const alt = "Deviso pour les experts-comptables : vos clients micro et TPE suivis depuis un seul cockpit";
export const size = TAILLE;
export const contentType = "image/png";

export default function Image() {
  return miniatureCabinet();
}
