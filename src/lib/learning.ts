// Pure learning-math helpers — no DB client, so tests can load this module.

export type Lesson = { id: string; sort_order?: number | null; title?: string };

/** Completed lesson ids for one class, from raw lesson_progress rows. */
export function doneLessonIds(rows: any[] = [], classId: string): string[] {
  return rows
    .filter((r) => r?.completed === true && String(r.class_id) === String(classId))
    .map((r) => String(r.lesson_id));
}

/** Completion share as an integer percent, clamped to 0..100. */
export function progressPct(lessons: Lesson[] = [], done: string[] = []): number {
  if (!lessons.length) return 0;
  const doneSet = new Set(done.map(String));
  const hits = lessons.filter((l) => doneSet.has(String(l.id))).length;
  return Math.min(100, Math.round((hits / lessons.length) * 100));
}

/** First lesson not yet completed, in catalog order. */
export function nextLesson(lessons: Lesson[] = [], done: string[] = []): Lesson | null {
  const doneSet = new Set(done.map(String));
  const ordered = [...lessons].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  return ordered.find((l) => !doneSet.has(String(l.id))) ?? null;
}

/** A certificate is only claimable once every lesson is completed. */
export function certificateEligible(lessons: Lesson[] = [], done: string[] = []): boolean {
  if (!lessons.length) return false;
  const doneSet = new Set(done.map(String));
  return lessons.every((l) => doneSet.has(String(l.id)));
}
