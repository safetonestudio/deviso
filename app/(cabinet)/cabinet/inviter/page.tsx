import type { Metadata } from "next";
import { CabinetInvitations } from "@/components/CabinetInvitations";

export const metadata: Metadata = { title: "Inviter un client" };

/** Codes d'invitation (sortis du bas du portefeuille le 20/11/2026). */
export default function CabinetInviter() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="titre-page">Inviter un client</h1>
        <p className="sous-titre-page">
          Générez un code et transmettez-le à votre client. Dès qu&apos;il le saisit dans Deviso, son dossier
          rejoint votre portefeuille, en lecture seule.
        </p>
      </div>
      <CabinetInvitations />
    </div>
  );
}
