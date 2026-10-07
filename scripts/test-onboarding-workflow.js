const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflowPath = process.argv[2] || 'n8n-workflow-mayar-callback.json';
const raw = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const workflow = Array.isArray(raw) ? raw[0] : raw;
const nodes = Object.fromEntries(workflow.nodes.map((node) => [node.name, node]));
const parse = nodes['Code: Parse Mayar Callback']?.parameters?.jsCode || '';
const prep = nodes['Code: Siapkan Data LMS']?.parameters?.jsCode || '';
const emailPrep = nodes['Code: Siapkan Data untuk Auto Email']?.parameters?.jsCode || '';
const conns = workflow.connections || {};

assert.match(parse, /event\s*===\s*['"]payment\.received['"]\s*&&/, 'paid classification must require payment.received');
assert.match(parse, /x-callback-token/i, 'callback token must be verified');
assert.match(parse, /payment_ref:/i, 'duplicate transaction reference must be checked');
assert.match(prep, /tier:\(yearly\|lifetime\)/i, 'tier must be read from lead notes first');
assert.match(emailPrep, /throw new Error\(['"]Provisioning LMS gagal/, 'missing credentials must stop onboarding');
assert.ok(nodes['HTTP: Finalisasi Lead Paid'], 'lead must be marked paid only after fulfillment succeeds');
assert.equal(nodes['HTTP: Provision LMS Access']?.onError, undefined, 'provisioning failure must fail execution');
assert.equal(nodes['HTTP: Kirim Email (Resend)']?.onError, undefined, 'email failure must fail execution');
assert.equal(conns['HTTP: Kirim Email (Resend)']?.main?.[0]?.[0]?.node, 'HTTP: Finalisasi Lead Paid');
assert.deepEqual(conns['IF: Pembayaran Sukses?']?.main?.[0]?.map((x) => x.node), ['Code: Siapkan Data LMS']);
console.log('onboarding workflow contract passed');
