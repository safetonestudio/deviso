// Fetcher partage pour SWR (cache client, retour instantane sur une page deja visitee).
// Renvoie null sur 403 (acces reserve a une offre), leve une erreur sur les autres
// echecs reseau/serveur, sinon le corps JSON.
export class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super("HTTP " + status);
    this.status = status;
  }
}

export async function fetcher(url: string) {
  const r = await fetch(url);
  if (r.status === 403) return null;
  if (!r.ok) throw new HttpError(r.status);
  return r.json();
}
