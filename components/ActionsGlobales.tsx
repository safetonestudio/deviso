"use client";
import { NotificationBell } from "@/components/NotificationBell";

/**
 * Cloche des notifications, a placer en fin de ligne d'en-tete d'une page, apres les
 * boutons d'action de la page (comme sur la maquette du tableau de bord).
 * Une page qui la rend masque la barre du haut generique (voir globals.css).
 */
export function ActionsGlobales() {
  return (
    <div className="flex items-center gap-2">
      <NotificationBell placement="entete" />
    </div>
  );
}
