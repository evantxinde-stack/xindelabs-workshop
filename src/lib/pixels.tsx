import type { ReactNode } from "react";
import { admin } from "@/lib/supabase/server";

async function readSettings() {
  try {
    const { data } = await admin.from("settings").select("key,value");
    const get = (k: string) => data?.find((r) => r.key === k)?.value?.trim() ?? "";
    return { meta: get("meta_pixel"), tiktok: get("tiktok_pixel") };
  } catch {
    return { meta: "", tiktok: "" };
  }
}

function script(code: string, nonce?: string) {
  return <script key={code.slice(0, 16)} dangerouslySetInnerHTML={{ __html: code }} />;
}

export async function PixelScripts(): Promise<ReactNode> {
  try {
    const { meta, tiktok } = await readSettings();
    const nodes: ReactNode[] = [];
    if (meta) {
      nodes.push(
        script(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`)
      );
    }
    if (tiktok) {
      nodes.push(
        script(`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');ttq.page();}(window,document,'ttq');`)
      );
    }
    return <>{nodes}</>;
  } catch {
    return null;
  }
}