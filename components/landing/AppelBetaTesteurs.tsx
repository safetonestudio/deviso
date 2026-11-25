"use client";

import { useState } from "react";
import { BETA, candidaturesOuvertes } from "@/lib/beta";

/*
  Appel aux bêta-testeurs : remplace MOMENTANÉMENT la section tarifs de
  l'accueil (app/page.tsx, ancre #tarifs conservée pour les liens existants).
  TarifsTable reste intact et reprend sa place quand BETA_OUVERTE (lib/beta.ts)
  repasse à false. Conditions de la bêta : lib/beta.ts.

  Le formulaire envoie à /api/beta/candidature.
*/

const DATE_LIMITE = BETA.finCandidatures.toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const NB = " ";

const CARTES = [
  {
    filet: "bg-indigo-500",
    qui: "Pendant la bêta",
    titre: `${BETA.dureeMois} mois gratuits, tout compris`,
    texte:
      "Toutes les fonctions, équipe comprise, plateforme agréée comprise. Aucune carte bancaire demandée.",
  },
  {
    filet: "bg-blue-400",
    qui: "Ce que je vous demande",
    titre: "20 minutes et vos retours",
    texte:
      "Un premier échange de 20 minutes, puis Deviso sur vos vrais documents. Vous me dites ce qui bloque, je corrige.",
  },
  {
    filet: "bg-amber-400",
    qui: "Après la bêta",
    titre: `-${BETA.remise}${NB}% la première année`,
    texte:
      `Si vous continuez, votre abonnement est à -${BETA.remise}${NB}% pendant 12 mois. Vous décidez librement de rester ou non, vos factures restent consultables.`,
  },
];

const ETAPES = [
  ["Vous candidatez en 1 minute", "Votre activité et votre façon de facturer aujourd'hui."],
  ["Je vous réponds sous 48 heures", "Si votre profil correspond, vous recevez votre accès par courriel."],
  ["20 minutes ensemble, puis vos vrais documents", "Je vous installe, vous travaillez, vous me dites ce qui manque."],
];

const CHAMP =
  "mt-1.5 w-full h-11 rounded-lg bg-ds-bg border border-ink/15 px-3.5 text-[16px] text-ink placeholder:text-gray-500 focus:outline-hidden focus:border-indigo-500";

export function AppelBetaTesteurs() {

  return (
    <div>
      <div className="reveal max-w-[760px]">
        <p className="text-[14px] font-medium text-gray-400">Programme bêta</p>
        <h2 className="mt-3 text-[clamp(28px,2.6vw,40px)] leading-[1.1] font-semibold tracking-[-0.035em] text-ink">
          Testez Deviso avant tout le monde, gratuitement.
        </h2>
        <p className="mt-5 text-[17px] sm:text-[20px] leading-relaxed text-gray-300">
          Je cherche {BETA.places} entreprises qui font de vrais devis et de vraies factures, et qui acceptent de me dire ce qui ne
          va pas. En échange, Deviso complet, sans rien payer, pendant {BETA.dureeMois} mois.
        </p>
      </div>

      <div className="mt-12 sm:mt-16 grid gap-5 md:grid-cols-3 items-stretch">
        {CARTES.map((c) => (
          <div key={c.qui} className="reveal rounded-xl bg-ds-surface p-7 sm:p-8">
            <span className={`block h-[3px] w-10 rounded-full ${c.filet}`} aria-hidden="true" />
            <p className="mt-6 text-[14px] font-medium text-gray-400">{c.qui}</p>
            <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-ink">{c.titre}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-gray-300">{c.texte}</p>
          </div>
        ))}
      </div>

      <div className="reveal mt-5 rounded-xl bg-ds-surface px-7 py-6 sm:px-8 flex flex-wrap items-center gap-x-10 gap-y-3">
        <p className="flex-[1_1_260px] text-[17px] font-semibold text-ink">
          {BETA.places} places, candidatures jusqu&apos;au {DATE_LIMITE}
        </p>
        <p className="flex-[2_1_320px] text-[15px] leading-relaxed text-gray-300">
          Vous êtes client d&apos;un cabinet comptable ? Dites-le dans votre candidature : votre comptable peut suivre votre
          dossier gratuitement.
        </p>
      </div>

      <div id="candidature" className="mt-14 sm:mt-16 grid gap-10 lg:grid-cols-2 items-start scroll-mt-24">
        <div className="reveal">
          <h3 className="text-[24px] sm:text-[26px] font-semibold tracking-[-0.02em] text-ink">Comment ça se passe</h3>
          <ol className="mt-6 grid gap-3">
            {ETAPES.map(([t, d], i) => (
              <li key={t} className="rounded-lg bg-ds-surface p-5">
                <span className="text-[14px] font-semibold text-indigo-400 tabular-nums">Étape {i + 1}</span>
                <div className="mt-1 text-[17px] font-semibold text-ink">{t}</div>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-300">{d}</p>
              </li>
            ))}
          </ol>
        </div>

        <FormulaireCandidature />
      </div>
    </div>
  );
}

type Etat = { t: "saisie" } | { t: "envoi" } | { t: "envoye" } | { t: "erreur"; message: string };

function FormulaireCandidature() {
  const [etat, setEtat] = useState<Etat>({ t: "saisie" });

  if (!candidaturesOuvertes()) {
    return (
      <div className="reveal rounded-xl bg-ds-surface p-7 sm:p-8">
        <h3 className="text-[22px] font-semibold text-ink">Les candidatures sont closes</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-300">
          Merci pour votre intérêt. Écrivez-moi à support@getdeviso.fr pour être prévenu de l&apos;ouverture à tous.
        </p>
      </div>
    );
  }

  if (etat.t === "envoye") {
    return (
      <div className="reveal rounded-xl bg-ds-surface p-7 sm:p-8" role="status">
        <h3 className="text-[22px] font-semibold text-ink">Candidature envoyée</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-300">
          Merci. Vous allez recevoir un courriel de confirmation. Je lis votre candidature moi-même et je vous réponds sous 48 heures.
        </p>
      </div>
    );
  }

  return (
    <form
      className="reveal relative rounded-xl bg-ds-surface p-7 sm:p-8 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setEtat({ t: "envoi" });
        try {
          const res = await fetch("/api/beta/candidature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: f.get("nom"),
              email: f.get("email"),
              activite: f.get("activite"),
              statut: f.get("statut"),
              outil: f.get("outil"),
              message: f.get("mot"),
              echange: f.get("echange") === "on",
              site: f.get("site"),
            }),
          });
          const r = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(r.error || "Votre candidature n'a pas pu être envoyée. Réessayez.");
          setEtat({ t: "envoye" });
        } catch (err) {
          setEtat({ t: "erreur", message: err instanceof Error ? err.message : "Votre candidature n'a pas pu être envoyée." });
        }
      }}
    >
      <h3 className="text-[22px] font-semibold text-ink">Votre candidature</h3>
      <label className="text-[14px] font-medium text-ink">
        Prénom et nom
        <input type="text" name="nom" autoComplete="name" required maxLength={120} className={CHAMP} />
      </label>
      <label className="text-[14px] font-medium text-ink">
        Adresse e-mail
        <input type="email" name="email" autoComplete="email" required maxLength={200} className={CHAMP} />
      </label>
      <label className="text-[14px] font-medium text-ink">
        Votre activité
        <input type="text" name="activite" maxLength={160} placeholder="Photographe, plombier, agence de conseil..." className={CHAMP} />
      </label>
      <label className="text-[14px] font-medium text-ink">
        Votre statut
        <select name="statut" className={CHAMP}>
          <option>Micro-entreprise</option>
          <option>Entreprise individuelle au réel</option>
          <option>Société</option>
        </select>
      </label>
      <label className="text-[14px] font-medium text-ink">
        Comment facturez-vous aujourd&apos;hui ?
        <select name="outil" className={CHAMP}>
          <option>Word ou Excel</option>
          <option>Un autre logiciel</option>
          <option>Je commence mon activité</option>
        </select>
      </label>
      <label className="text-[14px] font-medium text-ink">
        Un mot sur vous (facultatif)
        <textarea name="mot" rows={3} maxLength={2000} className={`${CHAMP} h-auto py-3`} />
      </label>
      {/* Champ piège : invisible, ignoré des humains, rempli par les robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-gray-300">
        <input type="checkbox" name="echange" required className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" />
        J&apos;accepte un échange de 20 minutes et de donner mes retours pendant la bêta.
      </label>
      <button
        type="submit"
        disabled={etat.t === "envoi"}
        className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-on-accent text-[16px] font-semibold transition-colors disabled:opacity-60"
      >
        {etat.t === "envoi" ? "Envoi en cours..." : "Envoyer ma candidature"}
      </button>
      {etat.t === "erreur" && (
        <p role="alert" className="text-[14px] leading-relaxed text-red-400">{etat.message}</p>
      )}
      <p className="text-[13px] leading-relaxed text-gray-400">
        Vos réponses servent uniquement à étudier votre candidature.{" "}
        <a href="/confidentialite" className="underline hover:text-ink">Politique de confidentialité</a>.
      </p>
    </form>
  );
}
