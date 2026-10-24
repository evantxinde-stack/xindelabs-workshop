"use client";

import { useEffect, useRef } from "react";
import { leadIdFromLocation, trackEvent } from "@/lib/funnel";

export function TrackVisit({ event }: { event: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    trackEvent(leadIdFromLocation(), event);
  }, [event]);
  return null;
}