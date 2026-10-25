import { admin } from "@/lib/supabase/server";
import TutorialFunnel from "./funnel";
export const dynamic="force-dynamic";
export default async function TutorialPage(){const [{data:vip},{data:course}]=await Promise.all([admin.from("sales_page_config").select("vsl_youtube_id").eq("slug","vip").maybeSingle(),admin.from("classes").select("slug,title,trailer_youtube_id").eq("product_type","workshop").eq("is_published",true).order("sort_order").limit(1).maybeSingle()]);const {data:slot}=await admin.from("vip_config").select("month_label,total_slots,remaining_slots").order("updated_at",{ascending:false}).limit(1).maybeSingle();return <TutorialFunnel vip={{...slot,...vip}} course={course}/>}
