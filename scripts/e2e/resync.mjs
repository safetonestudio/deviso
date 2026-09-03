// Declenche une synchronisation explicite sur le compte de test.
import { BASE, secret } from "./lib.mjs";
const PROJECT_REF = "mjhsafxzbufpughtxhnw";
const ANON_KEY = "sb_publishable_hRUg4JPPW18LCuxPy3CC0Q_xVfR9Ut5";
const r = await fetch(`https://${PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON_KEY },
  body: JSON.stringify({ email: "superpdp-test@getdeviso.fr", password: secret("E2E_SUPERPDP_PASSWORD") }),
});
const t = await r.json();
const cookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(
  JSON.stringify({ access_token: t.access_token, refresh_token: t.refresh_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600 })
).toString("base64")}`;
const depart = Date.now();
const res = await fetch(`${BASE}/api/superpdp/sync`, {
  method: "POST",
  headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ explicite: true }),
});
console.log(res.status, (await res.text()).slice(0, 500));
console.log(`duree : ${((Date.now() - depart) / 1000).toFixed(2)} s`);
