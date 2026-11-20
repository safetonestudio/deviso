import { Hanken_Grotesk } from "next/font/google";

/**
 * Polices de l'app (tableau de bord client et espace cabinet).
 *
 * Inter, la police par defaut de presque tous les SaaS, donnait a l'app un
 * aspect de gabarit. Hanken Grotesk porte l'interface (lisible, chiffres
 * nets), titres compris : c'est la police du site public, l'app et le site
 * forment ainsi un seul produit (Bricolage Grotesque, retiree le 20/11/2026,
 * donnait aux titres de l'app une autre voix que ceux du site). Servie depuis
 * notre domaine au build : aucune requete vers Google cote visiteur.
 * Chargees uniquement par les mises en page de l'app, pas par le site public.
 */
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-app" });

export const policesApp = hanken.variable;
