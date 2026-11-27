export type LessonLink = {
  label: string;
  url: string;
};

export type LessonMode = "video" | "text" | "combo";

const LINKS_MARKER_RE = /\n?<!--XINDE_LINKS:([\s\S]*?)-->\s*$/;

export function parseLessonContent(
  rawContent: string | null | undefined,
  pdfUrl?: string | null,
): { body: string; links: LessonLink[] } {
  const text = String(rawContent ?? "");
  let body = text;
  let links: LessonLink[] = [];

  const match = text.match(LINKS_MARKER_RE);
  if (match) {
    body = text.slice(0, match.index).trimEnd();
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        links = parsed
          .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
          .map((x) => ({
            label: String(x.label ?? "").trim() || "Buka tautan",
            url: String(x.url ?? "").trim(),
          }))
          .filter((x) => x.url.length > 0);
      }
    } catch {
      links = [];
    }
  }

  const cleanPdf = String(pdfUrl ?? "").trim();
  if (cleanPdf && !links.some((l) => l.url === cleanPdf)) {
    links = [{ label: "Download / Buka Materi", url: cleanPdf }, ...links];
  }

  return { body, links };
}

export function serializeLessonContent(body: string, links: LessonLink[]): {
  content: string | null;
  pdf_url: string | null;
} {
  const cleanBody = body.trim();
  const cleanLinks = links
    .map((l) => ({
      label: l.label.trim() || "Buka tautan",
      url: l.url.trim(),
    }))
    .filter((l) => l.url.length > 0);

  const pdf_url = cleanLinks[0]?.url ?? null;

  if (!cleanLinks.length) {
    return { content: cleanBody || null, pdf_url };
  }

  const marker = `<!--XINDE_LINKS:${JSON.stringify(cleanLinks)}-->`;
  const content = cleanBody ? `${cleanBody}\n\n${marker}` : marker;
  return { content, pdf_url };
}

export function detectLessonMode(lesson: {
  youtube_id?: string | null;
  body?: string;
}): LessonMode {
  const hasVideo = Boolean(String(lesson.youtube_id ?? "").trim());
  const hasText = Boolean(String(lesson.body ?? "").trim());
  if (hasVideo && hasText) return "combo";
  if (hasText && !hasVideo) return "text";
  return "video";
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInline(line: string): string {
  let out = escapeHtml(line);
  // [label](https://...)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#00ff88] underline underline-offset-4">$1 ↗</a>',
  );
  // **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');
  // `code`
  out = out.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-[#00ff88]">$1</code>',
  );
  return out;
}

export function renderLessonBodyHtml(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";

  // If legacy HTML already exists, return sanitized basic HTML
  if (/<(p|div|h[1-6]|ul|ol|li|br|strong|a)\b/i.test(trimmed)) {
    return trimmed
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/ on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript:/gi, "");
  }

  const blocks = trimmed.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trimEnd());
      if (lines.every((l) => /^[-*•]\s+/.test(l.trim()))) {
        const items = lines
          .map((l) => `<li>${formatInline(l.trim().replace(/^[-*•]\s+/, ""))}</li>`)
          .join("");
        return `<ul class="list-disc space-y-1.5 pl-5">${items}</ul>`;
      }
      if (lines.length === 1 && /^###\s+/.test(lines[0])) {
        return `<h4 class="text-base font-bold text-white">${formatInline(lines[0].replace(/^###\s+/, ""))}</h4>`;
      }
      if (lines.length === 1 && /^##\s+/.test(lines[0])) {
        return `<h3 class="text-lg font-bold text-white">${formatInline(lines[0].replace(/^##\s+/, ""))}</h3>`;
      }
      return `<p>${lines.map(formatInline).join("<br/>")}</p>`;
    })
    .join("");
}
