import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceUserId, getWorkspaceProfile } from "@/lib/workspace";
import { superpdpFetch, getConnection, SuperPdpNotConnected, SuperPdpSessionPending } from "@/lib/superpdp";
import { generateFacturXml } from "@/lib/invoice-xml";
import { isB2CInvoice } from "@/lib/facturx-helpers";
import { manquesPourEmission, phraseManques, transmissible } from "@/lib/superpdp-precontrole";
import { natureOperation } from "@/lib/superpdp-nature";
import { validerFacture, resumerEchecs } from "@/lib/superpdp-validation";
import { envoyerEncaissementPdp } from "@/lib/superpdp-encaissement";
import { statutQuiFaitFoi } from "@/lib/superpdp-sync";
import { resoudreAdresseClient } from "@/lib/superpdp-annuaire";
import type { Invoice } from "@/types";

/**
 * Émet une facture Deviso vers la Plateforme Agréée.
 *
 * C'est l'étape qui débloque le reste : tant qu'une facture n'existe pas chez
 * Super PDP, aucun statut de cycle de vie ne peut s'y accrocher — « Encaissée »
 * (212), pourtant obligatoire, n'a rien à quoi se rattacher.
 *
 * On envoie le **XML CII** et non le PDF Factur-X : la plateforme n'a besoin que
 * des données structurées, et c'est ce que leur route accepte en multipart —
 * vérifié le 12/08/2026 en envoyant une facture entre deux entreprises du bac à
 * sable.
 *
 * Le destinataire n'est pas passé en paramètre : il est **dans le XML**, sous
 * forme d'adresse électronique de facturation (BT-49, `URIID schemeID="0225"`),
 * dérivée du SIREN du client. D'où le contrôle préalable ci-dessous : sans SIREN
 * client, la facture n'est adressable à personne.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceUserId(user.id);
  const admin = createAdminClient();

  const { data: facture } = await admin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", workspaceId)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Déjà transmise : on ne réémet pas. Une facture envoyée deux fois arriverait
  // en double chez le client et déclencherait un refus pour « DOUBLON ».
  if (facture.superpdp_invoice_id) {
    return NextResponse.json({
      emise: true,
      dejaEmise: true,
      superpdpId: facture.superpdp_invoice_id,
    });
  }

  // Contrôles préalables, formulés en français plutôt que renvoyés bruts par la
  // plateforme. La règle vit dans lib/superpdp-precontrole.ts et sert aussi à
  // l'interface : elle sait donc AVANT le clic si la transmission peut aboutir.
  const isB2C = isB2CInvoice(facture as unknown as Invoice);

  // Un brouillon n'a pas d'existence, une facture annulée n'en a plus.
  // `transmissible()` n'était appliqué que par la liste : un appel direct à
  // cette route transmettait l'un ou l'autre à la Plateforme Agréée, de façon
  // irréversible. Une règle qui ne vit que dans l'interface n'est pas une règle.
  if (!transmissible(facture)) {
    return NextResponse.json(
      {
        error: "Facture non transmissible",
        message:
          facture.status === "draft"
            ? "Un brouillon ne peut pas être transmis. Envoyez d'abord la facture."
            : "Une facture annulée ne peut pas être transmise.",
      },
      { status: 400 }
    );
  }

  const manques = manquesPourEmission(facture);
  if (manques.length) {
    return NextResponse.json(
      { error: "Informations manquantes", message: phraseManques(manques), manques },
      { status: 400 }
    );
  }

  // Verrou d'émission : la garde anti-doublon ci-dessus ne suffit pas.
  //
  // Elle lit `superpdp_invoice_id`, le trouve vide, puis transmet. Entre les
  // deux il s'écoule plusieurs secondes — génération du XML, validation
  // officielle, POST — pendant lesquelles un second appel lit la même valeur
  // vide et transmet lui aussi. La facture arrive en double chez le client,
  // qui la refuse pour « DOUBLON », et il faut passer un avoir. Le bouton est
  // désactivé pendant l'envoi, mais un second onglet, un réessai réseau ou un
  // appel direct à l'API contournent l'interface.
  //
  // On remplace donc la lecture par une PRISE : un UPDATE conditionnel que la
  // base arbitre. Le premier appel obtient sa ligne, les suivants en obtiennent
  // zéro et s'arrêtent avant d'avoir rien envoyé.
  //
  // Le verrou se périme au bout de dix minutes : un plantage à mi-course ne
  // doit pas bloquer la facture pour toujours. C'est plus long que la durée
  // d'une émission (quelques secondes) et plus court que la patience de
  // quelqu'un qui réessaie.
  const perime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: prise } = await admin
    .from("invoices")
    .update({ superpdp_emission_debutee_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", workspaceId)
    .is("superpdp_invoice_id", null)
    .or(`superpdp_emission_debutee_at.is.null,superpdp_emission_debutee_at.lt.${perime}`)
    .select("id")
    .maybeSingle();

  if (!prise) {
    return NextResponse.json(
      {
        error: "Transmission déjà en cours",
        message:
          "Cette facture est déjà en cours de transmission. Patientez quelques secondes " +
          "et rechargez la page plutôt que de réessayer : un second envoi la ferait " +
          "arriver en double chez votre client.",
      },
      { status: 409 }
    );
  }

  /**
   * Rend le verrou. À appeler sur CHAQUE sortie qui n'a pas transmis.
   *
   * Le laisser posé après un échec bloquerait la facture dix minutes sans
   * raison — l'utilisateur corrige son adresse et se voit répondre « déjà en
   * cours » alors que rien ne l'est.
   */
  const rendreVerrou = () =>
    admin
      .from("invoices")
      .update({ superpdp_emission_debutee_at: null })
      .eq("id", id)
      .eq("user_id", workspaceId)
      .then(() => undefined, () => undefined);

  try {
    // Adresse électronique et numéro d'entreprise réellement enregistrés par
    // Super PDP pour NOUS (le vendeur) — voir generateFacturXml pour le
    // pourquoi. Les deux viennent du raccordement plutôt que du profil : c'est
    // ce que la Plateforme Agréée connaît de nous qui fait foi à l'émission,
    // pas ce que l'utilisateur a saisi.
    const connexion = await getConnection(workspaceId);

    // Adresse d'acheminement du destinataire : lue dans l'Annuaire plutôt que
    // fabriquée à partir du SIREN. Voir lib/superpdp-annuaire.ts pour l'ordre
    // de priorité et pourquoi la fabrication était fausse.
    const resolution = isB2C
      ? { adresse: null, source: "aucune" as const, candidats: undefined, obstacle: null }
      : await resoudreAdresseClient(workspaceId, facture);
    const { adresse: adresseClient, source: sourceAdresse } = resolution;

    // L'annuaire connaît ce client, mais nous ne pouvons pas choisir pour lui.
    //
    // On refuse plutôt que de tirer au sort. Une facture envoyée au mauvais
    // service d'une grande entreprise n'est pas rejetée : elle est acceptée,
    // rangée ailleurs, et jamais payée — le pire des trois résultats possibles,
    // parce qu'il ne lève rien. Mieux vaut demander une fois à l'utilisateur.
    if (!isB2C && resolution.obstacle === "ambigu") {
      const liste = (resolution.candidats ?? []).join(", ");
      return NextResponse.json(
        {
          error: "Adresse d'acheminement à choisir",
          message:
            `${facture.client_name || "Votre client"} publie plusieurs adresses de facturation ` +
            `électronique, une par service. Demandez-lui laquelle utiliser et renseignez-la sur ` +
            `la facture : ${liste}.`,
          candidats: resolution.candidats ?? [],
          obstacle: resolution.obstacle,
        },
        { status: 400 }
      );
    }

    // Coordonnées bancaires et facture d'acompte liée.
    //
    // Elles étaient passées à `undefined` ici, et NULLE PART AILLEURS : le PDF
    // téléchargé par le vendeur, celui envoyé par courriel et le dépôt Chorus
    // Pro les renseignent tous les trois. La facture qui arrivait chez le
    // client par la Plateforme Agréée était donc la seule à ne porter ni IBAN
    // (BG-16 / BT-84) ni référence à l'acompte qu'elle solde (BG-3 / BT-25).
    // Deux documents différents pour la même facture, et un client qui ne sait
    // pas où payer.
    const profil = await getWorkspaceProfile<{
      payment_method: string | null;
      payment_link_profile: string | null;
      bank_iban: string | null;
      bank_bic: string | null;
      bank_account_name: string | null;
    }>(workspaceId, "payment_method, payment_link_profile, bank_iban, bank_bic, bank_account_name");

    const paiement = profil
      ? {
          method: profil.payment_method,
          linkUrl: profil.payment_link_profile,
          bankIban: profil.bank_iban,
          bankBic: profil.bank_bic,
          bankAccountName: profil.bank_account_name,
        }
      : undefined;

    // Référence au document précédent (BG-3). Deux cas la remplissent, et pour
    // la même raison : ce document-ci ne se comprend qu'avec l'autre.
    //
    //   - une facture de solde renvoie à son acompte ;
    //   - un **avoir** renvoie à la facture qu'il annule. Sans cette référence,
    //     le destinataire reçoit un crédit qui ne dit pas ce qu'il corrige, et
    //     son comptable ne peut le rapprocher de rien.
    let numeroAcompte: string | null = null;
    if (
      (facture.invoice_type === "solde" || facture.invoice_type === "avoir") &&
      facture.linked_invoice_id
    ) {
      const { data: liee } = await admin
        .from("invoices")
        .select("invoice_number")
        .eq("id", facture.linked_invoice_id)
        .eq("user_id", workspaceId)
        .maybeSingle();
      numeroAcompte = liee?.invoice_number ?? null;
    }

    const xml = generateFacturXml(
      facture as unknown as Invoice,
      numeroAcompte,
      paiement,
      connexion?.directory_address ?? null,
      connexion?.company_number ?? null,
      adresseClient
    );

    const formulaire = new FormData();
    formulaire.append(
      "file",
      new Blob([xml], { type: "application/xml" }),
      `${facture.invoice_number || facture.id}.xml`
    );

    // `processing_rule` : on déclare la nature qu'on a détectée, et Super PDP
    // **répond en erreur** si son propre calcul diffère. C'est un filet gratuit
    // sur notre détection B2C, qui n'est qu'une heuristique (absence de raison
    // sociale). Sans ce paramètre, un mauvais classement passerait inaperçu et
    // partirait dans le mauvais flux d'e-reporting.
    //
    // `external_id` : notre identifiant de facture, pour que leur côté et le
    // nôtre se rattachent sans dépendre du seul numéro de facture.
    // La nature de l'opération, pays compris. `isB2C ? "B2C" : "B2B"` envoyait
    // une facture à un client étranger dans le circuit national, qui n'a pas à
    // l'acheminer. Voir lib/superpdp-nature.ts.
    const nature = natureOperation(facture);

    // `external_id` est plafonné à 36 caractères par la spec, et un UUID en
    // fait exactement 36 : la marge est nulle. On tronque plutôt que de faire
    // échouer toutes les émissions le jour où cet identifiant change de forme.
    const params = new URLSearchParams({
      processing_rule: nature,
      external_id: String(facture.id).slice(0, 36),
    });

    // Validation en amont, telle que la spec la recommande.
    //
    // « Most of errors like that can be avoided by calling the
    // /validation_reports endpoint first » — description du statut
    // `api:invalid`. Sans cet appel, une facture syntaxiquement acceptée mais
    // sémantiquement fausse repart en `api:invalid` de façon ASYNCHRONE : le
    // POST répond 200, l'utilisateur croit sa facture partie, et elle ne l'est
    // pas. C'est le seul moyen de le savoir avant.
    //
    // On ne bloque que sur un verdict explicitement négatif : une validation
    // injoignable ne doit jamais empêcher d'émettre.
    const rapport = await validerFacture(xml, `${facture.invoice_number || facture.id}.xml`);
    if (!rapport.valide && rapport.echecs.length) {
      const lignes = resumerEchecs(rapport.echecs);
      await admin
        .from("invoices")
        .update({
          superpdp_error: `Validation : ${lignes.join(" | ")}`.slice(0, 1000),
          superpdp_status_date: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", workspaceId);

      await rendreVerrou();
      return NextResponse.json(
        {
          error: "Facture non conforme",
          message:
            "La Plateforme Agréée rejetterait cette facture. Elle n'a donc pas été transmise, " +
            "pour éviter un rejet qui aurait été constaté bien plus tard.",
          echecs: lignes,
          sourceAdresse,
        },
        { status: 422 }
      );
    }

    const res = await superpdpFetch(workspaceId, `/invoices?${params}`, {
      method: "POST",
      body: formulaire,
    });

    const texte = await res.text();

    if (!res.ok) {
      // Une facture invalide et une panne de plateforme ne se disent pas
      // pareil.
      //
      // La spec ne documente que deux échecs pour `POST /invoices` : `400
      // bad_request` et `500 internal_server_error`, tous deux au format
      // `http_ko` = `{ code, http_status_code, message }`. Les confondre sous
      // « la Plateforme Agréée a refusé la facture » envoie l'utilisateur
      // corriger une facture correcte pendant que le problème est chez eux.
      //
      // `message` porte l'avertissement « Do not use programmaticaly, there is
      // no backward compatibility guarantee » : on l'affiche, on ne s'en sert
      // pas pour décider. `code` est le seul champ exploitable, on le conserve.
      let messagePdp: string | null = null;
      let codePdp: number | null = null;
      try {
        const ko = JSON.parse(texte) as { code?: number; message?: string };
        messagePdp = typeof ko.message === "string" ? ko.message : null;
        codePdp = typeof ko.code === "number" ? ko.code : null;
      } catch {
        // Réponse non JSON : on garde le texte brut, c'est mieux que rien.
      }

      const panne = res.status >= 500;
      const detail = (codePdp !== null ? `[${codePdp}] ` : "") + (messagePdp ?? texte.slice(0, 900));

      await admin
        .from("invoices")
        .update({ superpdp_error: detail.slice(0, 1000), superpdp_status_date: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", workspaceId);

      console.error(`[superpdp/emettre] ${id} : HTTP ${res.status} ${detail.slice(0, 300)}`);
      await rendreVerrou();
      return NextResponse.json(
        {
          error: panne ? "Plateforme indisponible" : "Facture refusée",
          message: panne
            ? "La Plateforme Agréée rencontre un incident. Votre facture n'a rien d'incorrect — réessayez dans quelques minutes."
            : messagePdp
              ? `La Plateforme Agréée a refusé la facture : ${messagePdp}`
              : "La Plateforme Agréée a refusé la facture. Le détail est enregistré sur la facture.",
          detail,
          code: codePdp,
          reessayable: panne,
          // Remontée même en cas de refus : savoir d'où venait l'adresse du
          // destinataire est la première question qu'on se pose devant un rejet
          // d'acheminement, et la relire dans le XML coûte une session de
          // débogage.
          sourceAdresse,
        },
        { status: panne ? 503 : 502 }
      );
    }

    // La facture EXISTE désormais chez la Plateforme Agréée. Tout ce qui suit
    // doit donc s'attacher à ne pas perdre son identifiant : sans lui, le
    // garde-fou anti-doublon plus haut ne joue plus, et le prochain clic
    // renvoie la même facture — le refus « DOUBLON » qu'on veut éviter.
    let reponse: { id?: number; events?: { status_code?: string }[]; processing_rule?: string } = {};
    try {
      reponse = JSON.parse(texte);
    } catch {
      // Réponse 200 non JSON : l'émission a réussi mais on ne sait pas sous
      // quel identifiant. Le dire est la seule attitude honnête — et le texte
      // brut est conservé pour pouvoir retrouver la facture à la main.
      console.error(`[superpdp/emettre] ${id} : réponse 200 illisible ${texte.slice(0, 300)}`);
      await admin
        .from("invoices")
        .update({
          superpdp_error: `Transmission acceptée mais réponse illisible : ${texte.slice(0, 800)}`,
          superpdp_status_date: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", workspaceId);
      return NextResponse.json(
        {
          error: "Réponse illisible",
          message:
            "La facture a été acceptée mais la Plateforme Agréée a renvoyé une réponse que nous n'avons pas su lire. " +
            "Ne la retransmettez pas : elle risquerait d'arriver en double. Contactez-nous.",
        },
        { status: 502 }
      );
    }

    // `processing_rule` renvoyé est la règle QUE SUPER PDP A CALCULÉE, pas
    // celle qu'on a déclarée. Un écart entre les deux est le seul signal
    // objectif que notre classification B2B/B2C/B2BInt s'est trompée — notre
    // détection du B2C reposant sur l'absence de raison sociale, elle peut se
    // tromper en silence.
    if (reponse.processing_rule && reponse.processing_rule !== nature) {
      console.error(
        `[superpdp/emettre] ${id} : nature déclarée ${nature}, calculée ${reponse.processing_rule}`
      );
    }

    const { error: erreurEnregistrement } = await admin
      .from("invoices")
      .update({
        superpdp_invoice_id: reponse.id != null ? String(reponse.id) : null,
        // `at(-1)` était exactement ce que `statutQuiFaitFoi` interdit, et pour
        // les mêmes raisons : la réponse d'émission porte déjà plusieurs
        // événements, dont des `ppf:*` d'acheminement administratif qui n'ont
        // rien à dire à l'utilisateur. Le dernier du tableau pouvait donc
        // s'inscrire comme statut de la facture, et l'écran afficher un code
        // brut sur une facture qui venait de partir normalement. Une seule
        // règle pour cette colonne, ici comme à la synchronisation.
        superpdp_status: statutQuiFaitFoi(reponse.events) ?? "api:uploaded",
        superpdp_status_date: new Date().toISOString(),
        superpdp_error: null,
        // Conservé, pas seulement renvoyé : c'est ce qui permet, des jours plus
        // tard, de savoir si une facture « transmise » l'a été à une adresse
        // sûre ou à un SIREN nu qui peut ne désigner personne.
        superpdp_adresse_source: sourceAdresse,
        // Le verrou a fait son office : c'est `superpdp_invoice_id` qui garde
        // désormais la facture contre un second envoi.
        superpdp_emission_debutee_at: null,
      })
      .eq("id", id)
      .eq("user_id", workspaceId);

    if (erreurEnregistrement) {
      // Répondre « emise: true » ici serait le pire des deux mondes : la
      // facture est partie, mais rien ne le note, donc le prochain clic la
      // renverra. On préfère un message explicite qui interdit le second envoi.
      console.error(`[superpdp/emettre] ${id} : identifiant non enregistré — ${erreurEnregistrement.message}`);
      return NextResponse.json(
        {
          error: "Transmission non enregistrée",
          message:
            `La facture a bien été transmise (référence ${reponse.id}), mais Deviso n'a pas pu l'enregistrer. ` +
            "Ne la retransmettez pas : elle arriverait en double chez votre client.",
          superpdpId: reponse.id,
        },
        { status: 500 }
      );
    }

    // Une facture déjà payée au moment de sa transmission doit déclarer son
    // encaissement TOUT DE SUITE.
    //
    // Leur documentation, section E-reporting : « Les données d'e-reporting de
    // paiement sont créées à partir du message de cycle de vie "Encaissée
    // (212)" […] **Pour les factures déjà encaissées à l'émission, il faut
    // envoyer ce message de cycle de vie juste après sa création.** »
    //
    // Sans ça, une facture encaissée avant d'être transmise — le cas d'un
    // paiement comptant, ou d'une facture régularisée après coup — ne produit
    // JAMAIS son flux 10.2 : le bouton « Marquer comme payée » a déjà été
    // cliqué, et il ne le sera pas une seconde fois. La déclaration manque, en
    // silence.
    //
    // Sans effet sur une vente de marchandise : « Pour les factures qui ne
    // nécessitent pas d'e-reporting de paiement (vente de marchandise), le
    // message de cycle de vie "Encaissée (212)" n'aura aucun effet. »
    if (facture.status === "paid" && !facture.superpdp_encaisse_at) {
      // Avec sa vraie date quand on l'a. Une facture déjà payée au moment où on
      // la transmet a souvent été encaissée bien avant — c'est même la
      // définition du cas — donc dater l'encaissement du jour de la
      // transmission serait faux de plusieurs jours sur la donnée qui fixe
      // l'exigibilité. `paid_at` absente, la plateforme date elle-même : on
      // n'invente rien.
      const encaissement = await envoyerEncaissementPdp(workspaceId, id, facture.paid_at ?? null);
      if (!encaissement.ok) {
        console.error(`[superpdp/emettre] ${id} : encaissement immédiat non déclaré — ${encaissement.raison}`);
      }
    }

    // `sourceAdresse` remonte à l'appelant : c'est ce qui permet à l'interface
    // — et aux tests — de distinguer une adresse lue dans l'Annuaire d'un repli
    // sur le SIREN nu, sans avoir à relire le XML.
    return NextResponse.json({ emise: true, superpdpId: reponse.id, sourceAdresse });
  } catch (err) {
    // Ces deux exceptions sont levées par `superpdpFetch` avant tout envoi :
    // rien n'est parti, on rend le verrou.
    if (err instanceof SuperPdpNotConnected) {
      await rendreVerrou();
      return NextResponse.json(
        {
          error: "Non raccordé",
          message: "Raccordez votre entreprise à la Plateforme Agréée depuis vos paramètres.",
        },
        { status: 409 }
      );
    }
    if (err instanceof SuperPdpSessionPending) {
      await rendreVerrou();
      return NextResponse.json(
        {
          error: "Vérification en cours",
          message: "Super PDP vérifie encore le rattachement de votre entreprise.",
        },
        { status: 409 }
      );
    }
    // Exception inconnue : on garde le verrou, délibérément.
    //
    // On ne sait pas si le POST a eu lieu — une coupure pendant la lecture de
    // la réponse laisse une facture transmise dont nous ignorons tout. Le
    // verrou se périmera seul dans dix minutes. Faire patienter quelqu'un dix
    // minutes est un désagrément ; lui faire envoyer une facture en double est
    // un incident comptable chez son client.
    console.error("[superpdp/emettre]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        error: "Transmission impossible",
        message:
          "Une erreur inattendue est survenue et nous ne savons pas si la facture est partie. " +
          "Ne la retransmettez pas tout de suite : rechargez la page dans quelques minutes " +
          "pour voir son état réel.",
      },
      { status: 500 }
    );
  }
}
