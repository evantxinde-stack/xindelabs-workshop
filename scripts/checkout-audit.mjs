// Checkout audit: exercises every published class/workshop/product checkout route
// with probes that fail BEFORE invoice creation, so no real Mayar invoice or order
// row is created. Read the published catalog over PostgREST, then POST validation
// failures to the live /api/checkout.
//
//   node --env-file=/home/ubuntu/n8n.env scripts/checkout-audit.mjs [baseUrl]
//
// Never enables the happy path: a valid checkout creates a real invoice.

const base = (process.argv[2] || "https://xindelabs.web.id").replace(/\/$/, "");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required (use --env-file=/home/ubuntu/n8n.env)");
  process.exit(2);
}

const DISCORD = "123456789012345678";
const identity = { name: "Audit Probe", email: "audit-probe@example.com", whatsapp: "081234567890" };

async function catalog() {
  const res = await fetch(`${url}/rest/v1/classes?select=id,slug,title,product_type,price,payment_options,is_published&is_published=eq.true&order=slug`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`catalog read failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function probe(label, body, expect) {
  const res = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const ok = res.status === expect.status && (!expect.match || expect.match.test(json.error || ""));
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(52)} ${res.status} ${JSON.stringify(json.error || json).slice(0, 70)}`);
  return ok;
}

const rows = await catalog();
console.log(`catalog: ${rows.length} published rows\n`);

let failures = 0;
const check = async (...a) => { if (!(await probe(...a))) failures++; };

for (const cls of rows) {
  const tag = `${cls.slug} [${cls.product_type}]`;
  const common = { product: cls.slug, class_id: cls.id, ...identity, discord_id: DISCORD };
  await check(`${tag} · rejects a bad payment_option`, { ...common, payment_option: "weekly" }, { status: 400, match: /payment_option/ });
  await check(`${tag} · rejects a bad Discord id`, { product: cls.slug, class_id: cls.id, ...identity, discord_id: "123" }, { status: 400, match: /Discord/ });
  if (!(cls.payment_options || []).includes("annual")) {
    await check(`${tag} · rejects annual when not offered`, { ...common, payment_option: "annual" }, { status: 400 });
  }
}

for (const product of ["vip", "fast_track"]) {
  await check(`product ${product} · rejects a bad payment_option`, { product, ...identity, discord_id: DISCORD, payment_option: "weekly" }, { status: 400, match: /payment_option/ });
  await check(`product ${product} · rejects a bad Discord id`, { product, discord_id: "1" }, { status: 400, match: /Discord/ });
  await check(`product ${product} · rejects a missing identity`, { product, discord_id: DISCORD, name: "", email: "x", whatsapp: "" }, { status: 400 });
}

await check("unknown class id · 404s instead of selling another product", { product: "nope-not-a-class", class_id: "00000000-0000-0000-0000-000000000000", ...identity, discord_id: DISCORD }, { status: 404 });

console.log(`\n${failures ? "FAILED" : "OK"}: ${failures} failing probe(s) of ${rows.length * 2 + 7}`);
process.exit(failures ? 1 : 0);
