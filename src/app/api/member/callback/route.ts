import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/auth-cookie";
import { createClient } from "@supabase/supabase-js";
export async function GET(req:Request){const url=new URL(req.url);const code=url.searchParams.get("code");if(!code)return NextResponse.redirect(new URL("/learn/login?error=oauth",url));return NextResponse.redirect(new URL(`/learn/auth/callback?code=${encodeURIComponent(code)}`,url));}
