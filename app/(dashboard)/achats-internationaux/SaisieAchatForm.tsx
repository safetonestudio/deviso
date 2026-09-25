"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAYS_FACTURATION } from "@/lib/superpdp-nature";

/**
 * Saisie manuelle d'un achat auprès d'un fournisseur étranger.
 *
 * Choix du manuel plutôt que de l'import PDF : la facture d'un fournisseur
 * étranger n'a aucun format garanti (langue, structure, devise), et une
 * extraction approximative ferait porter à l'utilisateur le risque d'une
 * déclaration fausse sans qu'il s'en aperçoive. Une saisie courte, avec les
 * montants recopiés depuis sa facture, est à la fois plus sûre et plus rapide
 * à livrer que de l'OCR.
 */

const champ =
  "w-full bg-ds-bg border border-ds-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600";
const etiquette = "block text-xs font-medium text-gray-400 mb-1.5";

export function SaisieAchatForm() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [fournisseurNom, setFournisseurNom] = useState("");
  const [pays, setPays] = useState("BE");
  const [tva, setTva] = useState("");
  const [numero, setNumero] = useState("");
  const [date, setDate] = useState("");
  const [categorie, setCategorie] = useState<"biens" | "services">("services");
  const [devise, setDevise] = useState("EUR");
  const [ht, setHt] = useState("");
  const [taux, setTaux] = useState("0");
  const [montantTva, setMontantTva] = useState("0");
  // L'utilisateur a-t-il saisi la TVA à la main ? Tant que non, on la calcule
  // depuis le taux — mais dès qu'il la corrige (cas de l'autoliquidation, où la
  // facture du fournisseur porte 0), on cesse d'écraser sa saisie.
  const [tvaManuelle, setTvaManuelle] = useState(false);

  const majTaux = (v: string) => {
    setTaux(v);
    if (!tvaManuelle) {
      const h = Number(ht);
      const t = Number(v);
      if (Number.isFinite(h) && Number.isFinite(t)) {
        setMontantTva((Math.round(h * (t / 100) * 100) / 100).toFixed(2));
      }
    }
  };

  const majHt = (v: string) => {
    setHt(v);
    if (!tvaManuelle) {
      const h = Number(v);
      const t = Number(taux);
      if (Number.isFinite(h) && Number.isFinite(t)) {
        setMontantTva((Math.round(h * (t / 100) * 100) / 100).toFixed(2));
      }
    }
  };

  const reinitialiser = () => {
    setFournisseurNom("");
    setPays("BE");
    setTva("");
    setNumero("");
    setDate("");
    setCategorie("services");
    setDevise("EUR");
    setHt("");
    setTaux("0");
    setMontantTva("0");
    setTvaManuelle(false);
  };

  const enregistrer = async () => {
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const r = await fetch("/api/superpdp/achats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fournisseur_nom: fournisseurNom,
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
        setErreur(d.message ?? d.error ?? "L'enregistrement n'a pas abouti.");
        return;
      }
      // Le stockage réussit toujours ; la transmission peut être différée par la
      // fenêtre de déclaration de la Plateforme Agréée. On le dit clairement.
      const t = d.transmission;
      setMessage(
        t?.ok
          ? "Achat enregistré et déclaré à la Plateforme Agréée."
          : "Achat enregistré. La déclaration sera transmise dès que la Plateforme Agréée l'accepte."
      );
      reinitialiser();
      setOuvert(false);
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  };

  if (!ouvert) {
    return (
      <div>
        <button
          onClick={() => {
            setOuvert(true);
            setMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Saisir un achat étranger
        </button>
        {message && <p className="text-sm text-emerald-400 mt-3">{message}</p>}
      </div>
    );
  }

  return (
    <section className="bg-ds-surface border border-ds-border rounded-xl p-5">
      <h2 className="text-white font-semibold mb-1">Nouvel achat à l&apos;étranger</h2>
      <p className="text-sm text-gray-400 mb-4">
        Recopiez les montants depuis la facture de votre fournisseur. Cette déclaration remplit
        votre obligation d&apos;e-reporting d&apos;acquisition (article 290-II du CGI).
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={etiquette} htmlFor="a-nom">Nom du fournisseur</label>
          <input id="a-nom" className={champ} value={fournisseurNom} onChange={(e) => setFournisseurNom(e.target.value)} placeholder="Ex. : Acme GmbH" />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-pays">Pays du fournisseur</label>
          <select id="a-pays" aria-label="Pays du fournisseur" className={champ} value={pays} onChange={(e) => setPays(e.target.value)}>
            {PAYS_FACTURATION.filter((p) => p.code !== "FR" && p.code !== "MC").map((p) => (
              <option key={p.code} value={p.code}>{p.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={etiquette} htmlFor="a-tva">N° de TVA du fournisseur <span className="text-gray-600">(si connu)</span></label>
          <input id="a-tva" className={champ} value={tva} onChange={(e) => setTva(e.target.value)} placeholder="Ex. : BE0123456749" />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-num">N° de la facture <span className="text-gray-600">(du fournisseur)</span></label>
          <input id="a-num" className={champ} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex. : INV-2026-042" />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-date">Date de la facture</label>
          <input id="a-date" type="date" aria-label="Date de la facture" className={champ} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-cat">Nature</label>
          <select id="a-cat" aria-label="Nature de l'achat" className={champ} value={categorie} onChange={(e) => setCategorie(e.target.value as "biens" | "services")}>
            <option value="services">Services (prestation)</option>
            <option value="biens">Biens (marchandise)</option>
          </select>
        </div>

        <div>
          <label className={etiquette} htmlFor="a-devise">Devise</label>
          <input id="a-devise" className={champ} value={devise} onChange={(e) => setDevise(e.target.value.toUpperCase())} maxLength={3} placeholder="EUR" />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-ht">Montant HT</label>
          <input id="a-ht" type="number" inputMode="decimal" step="0.01" min="0" className={champ} value={ht} onChange={(e) => majHt(e.target.value)} placeholder="1000.00" />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-taux">Taux de TVA (%)</label>
          <input id="a-taux" type="number" inputMode="decimal" step="0.01" min="0" className={champ} value={taux} onChange={(e) => majTaux(e.target.value)} placeholder="0" />
        </div>

        <div>
          <label className={etiquette} htmlFor="a-tvamt">Montant de TVA</label>
          <input
            id="a-tvamt"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className={champ}
            value={montantTva}
            onChange={(e) => {
              setTvaManuelle(true);
              setMontantTva(e.target.value);
            }}
            placeholder="0.00"
          />
          <p className="text-xs text-gray-600 mt-1">
            0 en cas d&apos;autoliquidation (services intra-UE, cas le plus courant).
          </p>
        </div>
      </div>

      {erreur && <p className="text-sm text-red-400 mt-4">{erreur}</p>}

      <div className="flex gap-2 mt-5">
        <button
          onClick={() => {
            setOuvert(false);
            setErreur(null);
          }}
          disabled={enCours}
          className="px-4 py-2 rounded-lg border border-ds-border text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={enregistrer}
          disabled={enCours}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer l'achat"}
        </button>
      </div>
    </section>
  );
}
