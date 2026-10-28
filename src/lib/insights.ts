import { billingAccess, ownsClass } from "./membership-access.ts";
import { progressPct } from "./learning.ts";

export function maskEmail(email: unknown): string {
  const value = String(email ?? "").trim().toLowerCase();
  const at = value.indexOf("@");
  if (at <= 0 || at === value.length - 1) return "";
  return `${value[0]}***${value.slice(at)}`;
}

export function certificateStatus(number: unknown, row: any): "valid" | "not_found" | "invalid" {
  const value = String(number ?? "").trim();
  if (!/^XL-[A-Z0-9]+-[A-Z0-9]+$/.test(value)) return "invalid";
  return row?.certificate_number === value ? "valid" : "not_found";
}

export function memberInsight({ member, classes = [], lessons = [], progress = [], certificates = [], orders = [] }: any) {
  const email = String(member?.email ?? "").toLowerCase();
  const paidOrders = orders.filter((o: any) => String(o.email ?? "").toLowerCase() === email && o.status === "paid");
  const ownedClasses = classes.filter((cls: any) => ownsClass(member, cls, paidOrders)).map((c: any) => c.id);
  const ownLessons = lessons.filter((l: any) => ownedClasses.includes(l.class_id));
  const done = progress.filter((p: any) => String(p.email ?? "").toLowerCase() === email && p.completed === true && ownedClasses.includes(p.class_id));
  const doneIds = new Set<string>(done.map((p: any) => String(p.lesson_id)));
  const lessonsDone = ownLessons.filter((l: any) => doneIds.has(l.id)).length;
  const certificatesCount = certificates.filter((c: any) => String(c.email ?? "").toLowerCase() === email).length;
  return {
    email,
    ownedClasses,
    lessonsDone,
    lessonsTotal: ownLessons.length,
    progressPct: progressPct(ownLessons, [...doneIds]),
    certificates: certificatesCount,
    paidRevenue: paidOrders.reduce((sum: number, o: any) => sum + Number(o.amount ?? 0), 0),
    access: billingAccess(member),
  };
}
