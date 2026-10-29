import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/app/learn/dashboard/page.tsx", import.meta.url), "utf8");

test("member dashboard selects only production class columns", () => {
  assert.doesNotMatch(page, /classes\?\.select\([^\n]*\btype\b/);
  assert.match(page, /is_published/);
});
