import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import Link from "next/link";
import { LearnShell, BackToClasses } from "../../catalog";
import { billingAccess, isAdminMember, learnMember, ownsClass } from "../../access";
import { doneLessonIds } from "@/lib/learning";
import CoursePlayer from "./player";
export const dynamic = "force-dynamic";
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { user, member } = await learnMember(); if (!user) redirect("/learn/login");
  const { data: cls } = await admin.from("classes").select("*").eq("slug", slug).maybeSingle();
  if (!cls) return <LearnShell><h1>Kelas tidak ditemukan</h1></LearnShell>;
  const [{ data: lessons }, { data: orders }] = await Promise.all([admin.from("lessons").select("*").eq("class_id", cls.id).order("sort_order"), admin.from("orders").select("class_id,product,status").eq("email", user.email ?? "")]);
  const allowed = (billingAccess(member) !== "none" && ownsClass(member, cls, orders ?? [])) || (ownsClass(member, cls, orders ?? []) && cls.product_type === "workshop" && Number(cls.price) === 0) || await isAdminMember();
  if (!allowed) return <LearnShell><div className="mb-6"><BackToClasses /></div><h1 className="text-4xl font-bold">{cls.title}</h1><div className="mt-8 rounded-2xl border border-[#00ff88]/30 bg-[#0B1F16] p-6"><p className="text-white/60">Kelas terkunci. Beli akses dengan harga member untuk membuka materi.</p><p className="mt-3 text-xl font-bold text-[#00ff88]">Rp{(Number(cls.member_cross_sell_price)>0?Number(cls.member_cross_sell_price):Number(cls.price)||0).toLocaleString("id-ID")}</p><a href={`/checkout/${cls.slug}`} className="mt-4 inline-block rounded-lg bg-[#00ff88] px-4 py-3 font-bold text-[#050A07]">Beli harga member</a></div></LearnShell>;
  const email = user.email!.toLowerCase(); const lessonRows = lessons ?? [];
  const [{ data: progress }, { data: certificate }] = await Promise.all([
    admin.from("lesson_progress").select("lesson_id,class_id,completed").eq("email", email).eq("class_id", cls.id),
    admin.from("certificates").select("certificate_number").eq("email", email).eq("class_id", cls.id).maybeSingle(),
  ]);
  return <LearnShell><div className="mb-6"><BackToClasses /></div><h1 className="text-4xl font-bold">{cls.title}</h1><CoursePlayer cls={cls} lessons={lessonRows} initialDone={doneLessonIds(progress ?? [], cls.id)} existingCertificate={certificate?.certificate_number ?? ""} /></LearnShell>;
}
