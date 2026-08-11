import { Resend } from "resend";

/**
 * Client d'envoi — clé « Sending access », volontairement restreinte.
 *
 * Il n'y a plus de client d'administration : la fonctionnalité « domaine d'envoi
 * personnalisé » a été retirée. Elle imposait à l'utilisateur d'éditer sa zone
 * DNS, plafonnait le nombre de clients au plan Resend, et faisait porter au
 * compte Deviso la réputation d'envoi de domaines tiers. Le nom commercial dans
 * le champ « De » et le Reply-To vers l'émetteur couvrent le besoin réel.
 */
export const resend = new Resend(process.env.RESEND_API_KEY);
