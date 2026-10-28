import { admin } from "@/lib/supabase/server";
import { classPrice, earlyBirdOpen } from "@/lib/mayar";
import { buildTutorialLadder } from "@/lib/tutorial-ladder";
import TutorialFunnel from "./funnel";
export const dynamic="force-dynamic";
const FIELDS="slug,title,description,product_type,price,annual_price,lifetime_price,payment_options,early_bird_price,early_bird_until,early_bird_quota,trailer_youtube_id,is_published,sort_order";
export default async function TutorialPage(){const [{data:rows},{data:vip},{data:slot}]=await Promise.all([admin.from("classes").select(FIELDS).eq("is_published",true),admin.from("sales_page_config").select("vsl_youtube_id").eq("slug","vip").maybeSingle(),admin.from("vip_config").select("month_label,total_slots,remaining_slots").order("updated_at",{ascending:false}).limit(1).maybeSingle()]);const ladder=buildTutorialLadder(rows??[]);const offer=(cls:any)=>{if(!cls)return null;const now=classPrice(cls,"lifetime"),regular=Number(cls.price);return {...cls,price_label:`Rp${now.toLocaleString("id-ID")}`,regular_label:earlyBirdOpen(cls)&&Number.isFinite(regular)&&now<regular?`Rp${regular.toLocaleString("id-ID")}`:null,checkout_href:`/checkout/${cls.slug}`};};return <TutorialFunnel vip={{...slot,...vip,...(offer(ladder.vip)??{})}} course={offer(ladder.course)??{}} free={ladder.free}/> }
