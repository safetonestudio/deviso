import { openSession, anonymous } from "./lib.mjs";

const o = await openSession("proprietaire");
const b = await openSession("membre");
console.log("userId proprietaire :", o.userId);
console.log("userId membre       :", b.userId);
console.log("emails identiques ? ", o.email === b.email, "->", o.email);

const inv = await o.call("/api/team", { method: "POST", body: JSON.stringify({ email: b.email }) });
console.log("invitation  :", inv.status, JSON.stringify(inv.body).slice(0, 200));

if (inv.body?.inviteUrl) {
  const t = inv.body.inviteUrl.split("/join/")[1];
  const a = await b.call(`/api/team/accept/${t}`);
  console.log("acceptation :", a.status, typeof a.body === "string" ? a.body.slice(0, 120) : JSON.stringify(a.body).slice(0, 160));
}

const team = await o.call("/api/team");
console.log("equipe (proprietaire) :", JSON.stringify(team.body).slice(0, 400));

// L'anonyme sur une route de document : 401 attendu, on a observé 404
const anon = await anonymous.call("/api/invoices/00000000-0000-0000-0000-000000000000");
console.log("anonyme sur facture inexistante :", anon.status, JSON.stringify(anon.body).slice(0, 120));

const anon2 = await anonymous.call("/api/invoices");
console.log("anonyme sur liste factures      :", anon2.status, JSON.stringify(anon2.body).slice(0, 120));
