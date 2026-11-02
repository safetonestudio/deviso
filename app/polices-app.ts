import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

/**
 * Polices de l'app (tableau de bord client et espace cabinet).
 *
 * Inter, la police par defaut de presque tous les SaaS, donnait a l'app un
 * aspect de gabarit. Hanken Grotesk porte l'interface (lisible, chiffres
 * nets), Bricolage Grotesque les titres. Servies depuis notre domaine au
 * build, comme Inter : aucune requete vers Google cote visiteur.
 * Chargees uniquement par les mises en page de l'app, pas par le site public.
 */
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-app" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-display" });

export const policesApp = `${hanken.variable} ${bricolage.variable}`;
