import { cookies, headers } from "next/headers";
import { authCookieOptions } from "@/lib/auth-cookie";
export async function POST(req: Request) { const { access_token } = await req.json().catch(()=>({})); if(typeof access_token!=="string"||!access_token)return Response.json({error:"Invalid token"},{status:400}); const host=(await headers()).get("host")||""; (await cookies()).set("member_access_token",access_token,authCookieOptions(host)); return Response.json({ok:true}); }
