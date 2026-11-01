/**
 * Archive ZIP minimale, sans compression (methode « stored »).
 *
 * Sert a livrer plusieurs exports en un seul telechargement (un FEC par
 * dossier client depuis le cockpit cabinet). Les fichiers sont du texte de
 * quelques centaines de Ko : la compression n'apporte rien qui justifie une
 * dependance. Noms en UTF-8 (bit 11 du drapeau) pour les accents.
 */

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type FichierZip = { nom: string; contenu: string | Uint8Array };

export function creerZip(fichiers: FichierZip[], date: Date = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const morceaux: Uint8Array[] = [];
  const centraux: Uint8Array[] = [];
  let offset = 0;

  const heureDos =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dateDos =
    ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  for (const f of fichiers) {
    const nom = enc.encode(f.nom);
    const data = typeof f.contenu === "string" ? enc.encode(f.contenu) : f.contenu;
    const crc = crc32(data);

    const local = new Uint8Array(30 + nom.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, 0x0800, true);
    l.setUint16(8, 0, true);
    l.setUint16(10, heureDos, true);
    l.setUint16(12, dateDos, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, data.length, true);
    l.setUint32(22, data.length, true);
    l.setUint16(26, nom.length, true);
    l.setUint16(28, 0, true);
    local.set(nom, 30);

    const central = new Uint8Array(46 + nom.length);
    const c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, heureDos, true);
    c.setUint16(14, dateDos, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, nom.length, true);
    c.setUint16(30, 0, true);
    c.setUint16(32, 0, true);
    c.setUint16(34, 0, true);
    c.setUint16(36, 0, true);
    c.setUint32(38, 0, true);
    c.setUint32(42, offset, true);
    central.set(nom, 46);

    morceaux.push(local, data);
    centraux.push(central);
    offset += local.length + data.length;
  }

  const tailleCentral = centraux.reduce((s, b) => s + b.length, 0);
  const fin = new Uint8Array(22);
  const e = new DataView(fin.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(4, 0, true);
  e.setUint16(6, 0, true);
  e.setUint16(8, fichiers.length, true);
  e.setUint16(10, fichiers.length, true);
  e.setUint32(12, tailleCentral, true);
  e.setUint32(16, offset, true);
  e.setUint16(20, 0, true);

  const out = new Uint8Array(offset + tailleCentral + fin.length);
  let p = 0;
  for (const b of [...morceaux, ...centraux, fin]) {
    out.set(b, p);
    p += b.length;
  }
  return out;
}
