"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYS_FACTURATION } from "@/lib/superpdp-nature";
import type { AchatInternational } from "@/lib/superpdp-achats";

/**
 * Correction d'un achat non encore declare, en ligne dans le volet deplie.
 * Permet d'ajouter l'identifiant fiscal du fournisseur ou de corriger une
 * saisie, puis retransmet : un achat en echec ou en attente ne reste jamais
 * bloque. Un achat deja transmis n'affiche pas ce bouton.
 */

const champ =
  "w-full bg-ds-bg border border-ds-border text-ink rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500 placeholder:text-gray-600";
const etiquette = "block text-xs font-medium text-gray-400 mb-1.5";

export function CorrigerAchat({ achat }: { achat: AchatInternational }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState(achat.fournisseur_nom);
  const [pays, setPays] = useState(achat.fournisseur_pays);
  const [tva, setTva] = useState(achat.fournisseur_tva ?? "");
  const [numero, setNumero] = useState(achat.numero ?? "");
  const [date, setDate] = useState(achat.date_facture);
  const [categorie, setCategorie] = useState<"biens" | "services">(achat.categorie);
  const [devise, setDevise] = useState(achat.devise);
  const [ht, setHt] = useState(String(achat.montant_ht));
  const [taux, setTaux] = useState(String(achat.taux_tva));
  const [montantTva, setMontantTva] = useState(String(achat.montant_tva));

  async function enregistrer() {
    setEnCours(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/superpdp/achats/${achat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fournisseur_nom: nom,
          fournisseur_pays: pays,
          fournisseur_tva: tva || null,
          numero: numero || null,
          date_facture: date,
          categorie,
          devise,
          montant_ht: Number(ht),
          taux_tva: Number(taux),
          montant_tva: Number(montantTva),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErreur(d.message ?? d.error ?? "La correction n'a pas abouti.");
        return;
      }
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/40 bg-indigo-500/5 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/10 transition-colors"
      >
        Corriger / compléter
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-ds-border bg-ds-elevated/40 p-4 mt-1">
      <p className="text-sm font-semibold text-ink mb-3">Corriger cet achat</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={etiquette}>Nom du fournisseur</label>
          <input className={champ} value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div>
          <label className={etiquette}>Pays du fournisseur</label>
          <select className={champ} value={pays} onChange={(e) => setPays(e.target.value)}>
            {PAYS_FACTURATION.filter((p) => p.code !== "FR" && p.code !== "MC").map((p) => (
              <option key={p.code} value={p.code}>{p.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={etiquette}>Identifiant fiscal du fournisseur</label>
          <input className={champ} value={tva} onChange={(e) => setTva(e.target.value)} placeholder="N° de TVA (UE), ou identifiant fiscal (hors UE)" />
          <p className="text-xs text-gray-600 mt-1">Nécessaire pour déclarer : TVA intracommunautaire (UE) ou identifiant fiscal local (hors UE).</p>
        </div>
        <div>
          <label className={etiquette}>N° de la facture</label>
          <input className={champ} value={numero} onChange={(e) => setNumero(e.target.value)} />
        </div>
        <div>
          <label className={etiquette}>Date de la facture</label>
          <input type="date" className={champ} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={etiquette}>Nature</label>
          <select className={champ} value={categorie} onChange={(e) => setCategorie(e.target.value as "biens" | "services")}>
            <option value="services">Services (prestation)</option>
            <option value="biens">Biens (marchandise)</option>
          </select>
        </div>
        <div>
          <label className={etiquette}>Devise</label>
          <input className={champ} value={devise} maxLength={3} onChange={(e) => setDevise(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className={etiquette}>Montant HT</label>
          <input type="number" step="0.01" min="0" className={champ} value={ht} onChange={(e) => setHt(e.target.value)} />
        </div>
        <div>
          <label className={etiquette}>Taux de TVA (%)</label>
          <input type="number" step="0.01" min="0" className={champ} value={taux} onChange={(e) => setTaux(e.target.value)} />
        </div>
        <div>
          <label className={etiquette}>Montant de TVA</label>
          <input type="number" step="0.01" min="0" className={champ} value={montantTva} onChange={(e) => setMontantTva(e.target.value)} />
          <p className="text-xs text-gray-600 mt-1">0 en cas d&apos;autoliquidation.</p>
        </div>
      </div>
      {erreur && <p className="text-sm text-red-400 mt-3">{erreur}</p>}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setOuvert(false)}
          disabled={enCours}
          className="px-4 py-2 rounded-lg border border-ds-border text-gray-400 hover:text-ink text-sm font-medium transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={enregistrer}
          disabled={enCours}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-ink text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer et déclarer"}
        </button>
      </div>
    </div>
  );
}
