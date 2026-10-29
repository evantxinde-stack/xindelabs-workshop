import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/server";
import { LearnShell, BackToClasses } from "../../catalog";
import LockedDetail from "../../locked-detail";
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
  if (!allowed) return <LearnShell><LockedDetail cls={cls} lessons={lessons ?? []} /></LearnShell>;
  const email = user.email!.toLowerCase(); const lessonRows = lessons ?? [];
  const [{ data: progress }, { data: certificate }] = await Promise.all([
    admin.from("lesson_progress").select("lesson_id,class_id,completed").eq("email", email).eq("class_id", cls.id),
    admin.from("certificates").select("certificate_number").eq("email", email).eq("class_id", cls.id).maybeSingle(),
  ]);
  return <LearnShell><div className="mb-6"><BackToClasses /></div><h1 className="text-4xl font-bold">{cls.title}</h1><CoursePlayer cls={cls} lessons={lessonRows} initialDone={doneLessonIds(progress ?? [], cls.id)} existingCertificate={certificate?.certificate_number ?? ""} /></LearnShell>;
}
