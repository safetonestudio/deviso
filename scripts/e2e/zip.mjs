/**
 * Archive ZIP du cockpit cabinet, sans reseau.
 *
 * lib/zip.ts livre plusieurs FEC en un seul telechargement. Une archive
 * corrompue s'ouvre parfois « vide » sans message clair : le comptable croirait
 * qu'un dossier n'a rien facture. On verifie le CRC sur le vecteur de reference
 * et on relit l'archive octet par octet comme le ferait un decompresseur.
 * (Validee aussi le 01/11/2026 contre le module zipfile de Python.)
 */
import { verifier, bilan } from "./lib.mjs";
import { creerZip, crc32 } from "../../lib/zip.ts";

console.log("");
console.log("-- ZIP du cockpit cabinet --");
console.log("");

const enc = new TextEncoder();
verifier("CRC32, vecteur de reference « 123456789 »", crc32(enc.encode("123456789")) === 0xcbf43926);

const fichiers = [
  { nom: "FEC_2026_Boulangerie_Durand.txt", contenu: "JournalCode\tJournalLib\r\nVT\tVentes" },
  { nom: "Factures_2026_Café_Léa.csv", contenu: "﻿Numéro;Montant HT (€)\r\nF-001;1234,56" },
];
const zip = creerZip(fichiers, new Date(2026, 10, 1, 12, 0, 0));
const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
// ignoreBOM : par defaut TextDecoder retire le BOM, que le CSV doit garder pour Excel.
const dec = new TextDecoder("utf-8", { ignoreBOM: true });

// Fin de repertoire central : 22 derniers octets.
const fin = zip.length - 22;
verifier("signature de fin de répertoire central", v.getUint32(fin, true) === 0x06054b50);
const nb = v.getUint16(fin + 10, true);
verifier("nombre d'entrées annoncé = 2", nb === 2);

let p = v.getUint32(fin + 16, true);
const relus = [];
for (let i = 0; i < nb; i++) {
  verifier(`entrée ${i + 1}, signature centrale`, v.getUint32(p, true) === 0x02014b50);
  const crc = v.getUint32(p + 16, true);
  const taille = v.getUint32(p + 20, true);
  const lnom = v.getUint16(p + 28, true);
  const offLocal = v.getUint32(p + 42, true);
  const nom = dec.decode(zip.subarray(p + 46, p + 46 + lnom));
  verifier(`entrée ${i + 1}, drapeau UTF-8 posé`, (v.getUint16(p + 8, true) & 0x0800) !== 0);
  verifier(`entrée ${i + 1}, signature locale`, v.getUint32(offLocal, true) === 0x04034b50);
  const debut = offLocal + 30 + v.getUint16(offLocal + 26, true) + v.getUint16(offLocal + 28, true);
  const data = zip.subarray(debut, debut + taille);
  verifier(`entrée ${i + 1}, CRC conforme au contenu`, crc32(data) === crc);
  relus.push({ nom, contenu: dec.decode(data) });
  p += 46 + lnom + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
}

verifier("noms accentués restitués à l'identique", relus.map((r) => r.nom).join("|") === fichiers.map((f) => f.nom).join("|"));
verifier("contenus restitués à l'identique (BOM compris)", relus.every((r, i) => r.contenu === fichiers[i].contenu));

bilan();
