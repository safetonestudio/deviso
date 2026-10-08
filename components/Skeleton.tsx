/**
 * Squelettes de chargement reutilisables.
 *
 * But : pendant qu'une page cliente attend ses donnees, afficher des blocs gris
 * a HAUTEUR RESERVEE plutot qu'un "Chargement." centre ou un ecran vide. La
 * mise en page ne bouge donc plus quand le contenu arrive (fini le "saut").
 *
 * Purement presentationnel : aucune donnee, aucune logique, aucun effet. Sans
 * risque pour la securite. `aria-hidden` car ces blocs ne portent pas de sens.
 */

/** Un bloc gris anime. `className` fixe sa taille (hauteur/largeur). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-ds-elevated ${className}`}
    />
  );
}

/** Une liste de lignes (factures, lignes de catalogue, contacts, paiements). */
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-ds-surface border border-ds-border animate-pulse"
        />
      ))}
    </div>
  );
}

/**
 * Squelette de page entiere : un titre, une rangee de cartes, puis des lignes.
 * A utiliser la ou le chargement remplace toute la page (retour anticipe), pour
 * que l'ossature soit deja en place avant l'arrivee des donnees.
 */
export function PageSkeleton({
  cards = 4,
  rows = 5,
}: {
  cards?: number;
  rows?: number;
}) {
  return (
    <div aria-hidden="true">
      <div className="h-8 w-52 rounded-lg bg-ds-elevated mb-6 animate-pulse" />
      {cards > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-ds-surface border border-ds-border animate-pulse"
            />
          ))}
        </div>
      )}
      <RowsSkeleton rows={rows} />
    </div>
  );
}
