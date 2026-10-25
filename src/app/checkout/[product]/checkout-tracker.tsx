"use client";

import { useEffect } from "react";
import { leadIdFromLocation, trackEvent } from "@/lib/funnel";

export function CheckoutTracker({ product }: { product: string }) {
  useEffect(() => {
    trackEvent(leadIdFromLocation(), "checkout_visited", { product });
  }, [product]);
  return null;
}