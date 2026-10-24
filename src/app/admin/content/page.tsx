import { admin } from "@/lib/supabase/server";
import ContentManager from "./manager";
export const dynamic="force-dynamic";
export default async function ContentPage(){const [{data:posts},{data:portfolio}]=await Promise.all([admin.from("blog_posts").select("*").order("updated_at",{ascending:false}),admin.from("portfolio").select("*").order("sort_order")]);return <><header><h1 className="text-2xl font-bold">Content Manager</h1><p className="mt-1 text-sm text-white/45">Blog dan portfolio showcase.</p></header><ContentManager initialPosts={posts??[]} initialPortfolio={portfolio??[]}/></>}
