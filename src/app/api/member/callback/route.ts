import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/auth-cookie";
import { createClient } from "@supabase/supabase-js";
export async function GET(req:Request){const url=new URL(req.url);const code=url.searchParams.get("code");if(!code)return NextResponse.redirect(new URL("/learn/login?error=oauth",url));const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://build-placeholder.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"build-placeholder-key");const {data,error}=await client.auth.exchangeCodeForSession(code);if(error||!data.session)return NextResponse.redirect(new URL("/learn/login?error=oauth",url));const response=NextResponse.redirect(new URL("/learn/dashboard",url));const host=url.hostname;response.cookies.set("member_access_token",data.session.access_token,authCookieOptions(host));return response;}
