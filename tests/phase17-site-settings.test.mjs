import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("centralized site settings route and sidebar link exist without removing existing nav", () => {
  const sidebar = read("src/components/AdminSidebar.tsx");
  const page = read("src/app/admin/site-settings/page.tsx");
  const editor = read("src/app/admin/site-settings/editor.tsx");
  const api = read("src/app/api/admin/site-settings/route.ts");

  assert.match(sidebar, /\/admin\/site-settings/);
  assert.match(sidebar, /\/admin\/editor/);
  assert.match(sidebar, /\/admin\/sales-pages/);
  assert.match(page, /getSiteConfig/);
  assert.match(editor, /\/api\/admin\/site-settings/);
  assert.match(api, /isAdminRequest/);
  assert.match(api, /site_config/);
  assert.match(api, /wa_admin_number/);
  assert.match(api, /revalidatePath\("\/"\)/);
  assert.match(api, /revalidatePath\("\/service"\)/);
  assert.match(api, /revalidatePath\("\/learn"\)/);
});

test("homepage, service, and learn pages read from centralized site config", () => {
  const home = read("src/app/page.tsx");
  const service = read("src/app/service/page.tsx");
  const learn = read("src/app/learn/page.tsx");

  assert.match(home, /getSiteConfig/);
  assert.match(service, /getSiteConfig/);
  assert.match(learn, /getSiteConfig/);
});
