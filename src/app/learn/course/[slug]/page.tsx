import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import { LearnShell } from "../../catalog";
import { isAdminMember, learnMember, ownsClass } from "../../access";
import CoursePlayer from "./player";
export const dynamic = "force-dynamic";
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { user, member } = await learnMember(); if (!user) redirect("/learn/login");
  const { data: cls } = await admin.from("classes").select("*").eq("slug", slug).maybeSingle();
  if (!cls) return <LearnShell><h1>Kelas tidak ditemukan</h1></LearnShell>;
  const [{ data: lessons }, { data: orders }] = await Promise.all([admin.from("lessons").select("*").eq("class_id", cls.id).order("sort_order"), admin.from("orders").select("*").eq("lead_id", member?.lead_id || "00000000-0000-0000-0000-000000000000")]);
  const allowed = ownsClass(member, cls, orders ?? []) || await isAdminMember();
  return <LearnShell><h1 className="text-4xl font-bold">{cls.title}</h1>{allowed ? <CoursePlayer cls={cls} lessons={lessons ?? []} memberId={member?.id} email={user.email} /> : <div className="mt-8 rounded-2xl border border-[#10B981]/30 bg-[#0A140E] p-6"><p className="text-white/60">Kelas terkunci. Beli akses untuk membuka materi.</p><a href={`/checkout/${cls.slug}`} className="mt-4 inline-block rounded-lg bg-[#10B981] px-4 py-3 font-bold text-[#050A07]">Beli sekarang</a></div>}</LearnShell>;
}
