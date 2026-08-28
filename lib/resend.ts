import { Resend } from "resend";
import { lazyClient } from "@/lib/lazy-client";

/**
 * Client d'envoi — clé « Sending access », volontairement restreinte.
 *
 * Il n'y a plus de client d'administration : la fonctionnalité « domaine d'envoi
 * personnalisé » a été retirée. Elle imposait à l'utilisateur d'éditer sa zone
 * DNS, plafonnait le nombre de clients au plan Resend, et faisait porter au
 * compte Deviso la réputation d'envoi de domaines tiers. Le nom commercial dans
 * le champ « De » et le Reply-To vers l'émetteur couvrent le besoin réel.
 *
 * Construction paresseuse (voir lib/lazy-client.ts) : le SDK Resend lève une
 * exception dans son constructeur si la clé est absente, ce qui faisait
 * échouer le build entier plutôt que la seule route qui envoie l'email.
 */
export const resend = lazyClient(() => new Resend(process.env.RESEND_API_KEY));
