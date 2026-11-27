import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  detectLessonMode,
  parseLessonContent,
  renderLessonBodyHtml,
  serializeLessonContent,
} from "../src/lib/lesson-content.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("product management and course management are separated in admin and sidebar", () => {
  const sidebar = read("src/components/AdminSidebar.tsx");
  const products = read("src/app/admin/products/page.tsx");
  const courses = read("src/app/admin/lms/courses/page.tsx");

  assert.match(sidebar, /\/admin\/products/);
  assert.match(sidebar, /Product Management/);
  assert.match(sidebar, /\/admin\/lms\/courses/);
  assert.match(sidebar, /Course Management/);
  assert.match(products, /Product Management/);
  assert.match(products, /\/api\/admin\/classes/);
  assert.match(courses, /Course Management/);
  assert.match(courses, /\/api\/admin\/lessons/);
});

test("lesson content helper supports video, text, combo, and multiple links", () => {
  const serialized = serializeLessonContent("## Langkah 1\n- Install tool\n**Selesai**", [
    { label: "Slide PDF", url: "https://example.com/slide.pdf" },
    { label: "Template Notion", url: "https://notion.so/template" },
  ]);

  assert.equal(serialized.pdf_url, "https://example.com/slide.pdf");
  assert.ok(serialized.content?.includes("XINDE_LINKS"));

  const parsed = parseLessonContent(serialized.content, serialized.pdf_url);
  assert.equal(parsed.body, "## Langkah 1\n- Install tool\n**Selesai**");
  assert.equal(parsed.links.length, 2);
  assert.equal(parsed.links[1].label, "Template Notion");

  assert.equal(detectLessonMode({ youtube_id: "abc123", body: "" }), "video");
  assert.equal(detectLessonMode({ youtube_id: "", body: "Materi teks" }), "text");
  assert.equal(detectLessonMode({ youtube_id: "abc123", body: "Penjelasan" }), "combo");

  const html = renderLessonBodyHtml("Lihat [dokumentasi](https://example.com) dan **penting**.");
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /<strong/);
});
