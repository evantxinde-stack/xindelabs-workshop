"use client";

import { useEffect } from "react";
import { leadIdFromLocation, trackEvent } from "@/lib/funnel";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function CheckoutTracker({ product }: { product: string }) {
  useEffect(() => {
    trackEvent(leadIdFromLocation(), "checkout_visited", { product });
    window.fbq?.("track", "ViewContent", { content_name: product, content_type: "product" });
  }, [product]);
  return null;
}