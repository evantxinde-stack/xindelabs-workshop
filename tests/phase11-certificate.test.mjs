import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { certificateEmail, certificatePrintTitle } from "../src/lib/certificate.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("certificate email escapes recipient data and includes verification URL", () => {
  const mail = certificateEmail({
    name: "<Evant>", email: "evant@example.com", certificateNumber: "XL-ABC-123", classTitle: "Bangun Agent",
    appUrl: "https://xindelabs.web.id",
  });
  assert.equal(mail.to, "evant@example.com");
  assert.match(mail.subject, /Sertifikat/);
  assert.match(mail.html, /&lt;Evant&gt;/);
  assert.match(mail.html, /https:\/\/xindelabs\.web\.id\/certificate\/XL-ABC-123/);
  assert.doesNotMatch(mail.html, /<Evant>/);
});

test("certificate email rejects malformed recipient", () => {
  assert.throws(() => certificateEmail({ name: "A", email: "bad", certificateNumber: "XL-A-1", classTitle: "C", appUrl: "https://xindelabs.web.id" }), /email/);
});

test("certificate print title is deterministic", () => {
  assert.equal(certificatePrintTitle("Bangun Hermes Agent"), "Certificate — Bangun Hermes Agent");
});

test("certificate claim sends email after creation and reports delivery state", () => {
  const route = read("src/app/api/member/certificate/route.ts");
  assert.match(route, /sendCertificateEmail/);
  assert.match(route, /email_pending/);
});

test("certificate page offers print/save PDF and remains verification-first", () => {
  const page = read("src/app/certificate/[number]/page.tsx");
  const button = read("src/components/CertificatePrintButton.tsx");
  assert.match(button, /window\.print/);
  assert.match(button, /Simpan sebagai PDF|Save as PDF/);
  assert.match(page, /certificate_number/);
});

test("email module exposes certificate delivery without leaking the API key", () => {
  const email = read("src/lib/email.ts");
  assert.match(email, /export async function sendCertificateEmail/);
  assert.doesNotMatch(email, /console\.(log|error)\([^)]*RESEND_API_KEY/);
});
