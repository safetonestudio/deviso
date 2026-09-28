"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PAYS_FACTURATION } from "@/lib/superpdp-nature";

/**
 * Saisie d'un achat auprès d'un fournisseur étranger, manuelle ou pré-remplie
 * depuis la facture.
 *
 * L'import PDF/photo a longtemps été écarté au motif qu'une facture étrangère
 * n'a aucun format garanti et qu'une extraction approximative ferait porter à
 * l'utilisateur le risque d'une déclaration fausse sans qu'il s'en aperçoive.
 * Ce risque tient tant que l'extraction DÉCIDE ; il tombe quand elle ne fait que
 * PROPOSER. Ici l'import ne fait que pré-remplir : le modèle laisse vide tout
 * champ qu'il ne lit pas avec certitude (au lieu de deviner), la route recontrôle
 * la cohérence et signale les écarts, et rien n'est enregistré ni transmis sans
 * que l'utilisateur relise et valide. La saisie manuelle reste possible et
 * intacte ; l'import n'est qu'un raccourci de frappe.
 */

const champ =
  "w-full bg-ds-bg border border-ds-border text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600";
const etiquette = "block text-xs font-medium text-gray-400 mb-1.5";

/** Libellés lisibles pour la liste des champs non lus. */
const LIBELLES: Record<string, string> = {
  fournisseur_nom: "nom du fournisseur",
  fournisseur_pays: "pays",
  fournisseur_tva: "n° de TVA",
  numero: "n° de facture",
  date_facture: "date",
  categorie: "nature",
  devise: "devise",
  montant_ht: "montant HT",
  taux_tva: "taux de TVA",
  montant_tva: "montant de TVA",
};

interface Apercu {
  avertissements: string[];
  nonLus: string[];
  confiance: string | null;
}

export function SaisieAchatForm() {
  const router = useRouter();
  const inputFichier = useRef<HTMLInputElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [apercu, setApercu] = useState<Apercu | null>(null);

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
  // depuis le taux, mais dès qu'il la corrige (cas de l'autoliquidation, où la
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
    setApercu(null);
  };

  /** Envoie la facture à la route d'extraction et pré-remplit les champs lus. */
  const importer = async (file: File) => {
    setImportEnCours(true);
    setErreur(null);
    setMessage(null);
    setApercu(null);
    try {
      const fd = new FormData();
      fd.append("fichier", file);
      const r = await fetch("/api/superpdp/achats/extraction", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErreur(d.message ?? d.error ?? "La facture n'a pas pu être lue.");
        setOuvert(true);
        return;
      }
      const c = d.champs ?? {};
      // On n'écrit que ce qui a été lu ; un champ null laisse la valeur en place
      // (défaut ou vide) et figure dans « à compléter ».
      if (c.fournisseur_nom) setFournisseurNom(c.fournisseur_nom);
      if (c.fournisseur_pays) setPays(c.fournisseur_pays);
      if (c.fournisseur_tva) setTva(c.fournisseur_tva);
      if (c.numero) setNumero(c.numero);
      if (c.date_facture) setDate(c.date_facture);
      if (c.categorie) setCategorie(c.categorie);
      if (c.devise) setDevise(c.devise);
      if (c.montant_ht != null) setHt(String(c.montant_ht));
      if (c.taux_tva != null) setTaux(String(c.taux_tva));
      if (c.montant_tva != null) {
        // La TVA lue fait foi : on empêche le recalcul automatique de l'écraser.
        setTvaManuelle(true);
        setMontantTva(String(c.montant_tva));
      }
      setApercu({
        avertissements: d.avertissements ?? [],
        nonLus: d.nonLus ?? [],
        confiance: d.confiance ?? null,
      });
      setOuvert(true);
    } catch {
      setErreur("Import interrompu. Réessayez, ou saisissez les champs à la main.");
      setOuvert(true);
    } finally {
      setImportEnCours(false);
      if (inputFichier.current) inputFichier.current.value = "";
    }
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

  return (
    <div>
      {/* Zone d'entrée : import de facture (raccourci) + saisie manuelle. */}
      {!ouvert && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              reinitialiser();
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

          <button
            onClick={() => inputFichier.current?.click()}
            disabled={importEnCours}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ds-border text-gray-200 text-sm font-semibold hover:bg-ds-elevated transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V3m0 0L7.5 7.5M12 3l4.5 4.5M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" />
            </svg>
            {importEnCours ? "Lecture de la facture…" : "Importer une facture (PDF ou photo)"}
          </button>

          <input
            ref={inputFichier}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importer(f);
            }}
          />
        </div>
      )}

      {message && <p className="text-sm text-emerald-400 mt-3">{message}</p>}
      {!ouvert && erreur && <p className="text-sm text-red-400 mt-3">{erreur}</p>}
      {!ouvert && (
        <p className="text-xs text-gray-600 mt-2 max-w-2xl">
          L&apos;import lit la facture pour vous faire gagner la saisie. Les valeurs restent à vérifier :
          rien n&apos;est déclaré tant que vous n&apos;avez pas validé.
        </p>
      )}

      {ouvert && (
        <section className="bg-ds-surface border border-ds-border rounded-xl p-5 mt-1">
          <h2 className="text-white font-semibold mb-1">Nouvel achat à l&apos;étranger</h2>
          <p className="text-sm text-gray-400 mb-4">
            Recopiez (ou vérifiez) les montants depuis la facture de votre fournisseur. Cette
            déclaration remplit votre obligation d&apos;e-reporting d&apos;acquisition (article 290-II du
            CGI).
          </p>

          {apercu && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <p className="text-amber-300 font-medium">
                Champs pré-remplis depuis votre facture. Vérifiez chaque valeur, surtout les montants,
                avant d&apos;enregistrer
                {apercu.confiance ? ` (confiance de lecture : ${apercu.confiance})` : ""}.
              </p>
              {apercu.nonLus.length > 0 && (
                <p className="text-amber-200/80 mt-1.5">
                  À compléter (non lus sur la facture) :{" "}
                  {apercu.nonLus.map((k) => LIBELLES[k] ?? k).join(", ")}.
                </p>
              )}
              {apercu.avertissements.map((a, i) => (
                <p key={i} className="text-amber-200/80 mt-1.5">
                  {a}
                </p>
              ))}
            </div>
          )}

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
                setApercu(null);
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
      )}
    </div>
  );
}
