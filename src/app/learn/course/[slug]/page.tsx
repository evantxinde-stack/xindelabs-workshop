import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import { LearnShell } from "../../catalog";
import { billingAccess, isAdminMember, learnMember, ownsClass } from "../../access";
import { doneLessonIds } from "@/lib/learning";
import CoursePlayer from "./player";
export const dynamic = "force-dynamic";
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { user, member } = await learnMember(); if (!user) redirect("/learn/login");
  const { data: cls } = await admin.from("classes").select("*").eq("slug", slug).maybeSingle();
  if (!cls) return <LearnShell><h1>Kelas tidak ditemukan</h1></LearnShell>;
  const [{ data: lessons }, { data: orders }] = await Promise.all([admin.from("lessons").select("*").eq("class_id", cls.id).order("sort_order"), admin.from("orders").select("*").eq("lead_id", member?.lead_id || "00000000-0000-0000-0000-000000000000")]);
  const allowed = (billingAccess(member) !== "none" && ownsClass(member, cls, orders ?? [])) || await isAdminMember();
  if (!allowed) return <LearnShell><h1 className="text-4xl font-bold">{cls.title}</h1><div className="mt-8 rounded-2xl border border-[#00ff88]/30 bg-[#0B1F16] p-6"><p className="text-white/60">Kelas terkunci. Beli akses untuk membuka materi.</p><a href={`/checkout/${cls.slug}`} className="mt-4 inline-block rounded-lg bg-[#00ff88] px-4 py-3 font-bold text-[#050A07]">Beli sekarang</a></div></LearnShell>;
  const email = user.email!.toLowerCase(); const lessonRows = lessons ?? [];
  const [{ data: progress }, { data: certificate }] = await Promise.all([
    admin.from("lesson_progress").select("lesson_id,class_id,completed").eq("email", email).eq("class_id", cls.id),
    admin.from("certificates").select("certificate_number").eq("email", email).eq("class_id", cls.id).maybeSingle(),
  ]);
  return <LearnShell><h1 className="text-4xl font-bold">{cls.title}</h1><CoursePlayer cls={cls} lessons={lessonRows} initialDone={doneLessonIds(progress ?? [], cls.id)} existingCertificate={certificate?.certificate_number ?? ""} /></LearnShell>;
}
