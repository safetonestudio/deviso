"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Déclenche une synchronisation des factures à l'ouverture de l'application.
 *
 * Rendu uniquement pour les espaces réellement raccordés — la vérification se
 * fait côté serveur dans le gabarit du tableau de bord. Le monter pour tout le
 * monde ajouterait un aller-retour inutile à chaque chargement de page pour
 * l'immense majorité des comptes, qui ne sont pas raccordés.
 *
 * Le serveur applique lui-même un délai minimal entre deux synchronisations ;
 * ce composant n'a donc pas à se retenir, et il peut se contenter d'un appel au
 * montage.
 */
export function SuperPdpSync() {
  const router = useRouter();

  useEffect(() => {
    let annule = false;

    fetch("/api/superpdp/sync", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        // On ne rafraîchit l'écran que si quelque chose est réellement arrivé.
        // Un `router.refresh()` systématique relancerait le rendu de toutes les
        // pages du tableau de bord pour rien.
        if (!annule && res?.recuperees > 0) router.refresh();
      })
      .catch(() => {
        // Réseau : la prochaine ouverture réessaiera, et le filet horaire
        // tourne de son côté.
      });

    return () => {
      annule = true;
    };
  }, [router]);

  return null;
}
