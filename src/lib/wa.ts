export type WaTemplate = { id: string; name: string; content: string };

export function sanitizePhone(n: string): string {
  const d = n.replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
}

export function fillTemplate(content: string, vars: Record<string, string | undefined>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? _m);
}

export function waLink(number: string, text: string): string {
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}