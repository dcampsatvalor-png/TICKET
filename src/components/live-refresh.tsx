"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_INTERVAL_MS = 8_000;
const MIN_REFRESH_GAP_MS = 2_000;

/**
 * Keeps the current server-rendered page fresh without a manual reload.
 * - Polls with router.refresh() while the tab is visible
 * - Optionally listens to Supabase Realtime on tickets / ticket_comments
 */
export function LiveRefresh({
  intervalMs = DEFAULT_INTERVAL_MS,
  realtime = false,
  showIndicator = true,
}: {
  intervalMs?: number;
  /** Subscribe to Postgres changes (requires Realtime enabled on the tables). */
  realtime?: boolean;
  showIndicator?: boolean;
}) {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    function refresh() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      const now = Date.now();
      if (now - lastRefreshAt.current < MIN_REFRESH_GAP_MS) return;
      lastRefreshAt.current = now;
      router.refresh();
    }

    const intervalId = window.setInterval(refresh, intervalMs);

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  useEffect(() => {
    if (!realtime) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes("your-project")) return;

    const supabase = createBrowserClient(url, key);

    function refreshSoon() {
      const now = Date.now();
      if (now - lastRefreshAt.current < MIN_REFRESH_GAP_MS) return;
      lastRefreshAt.current = now;
      router.refresh();
    }

    const channel = supabase
      .channel("helpdesk-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        refreshSoon
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_comments" },
        refreshSoon
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [realtime, router]);

  if (!showIndicator) return null;

  return (
    <p
      className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
      title="La lista se actualiza sola cada pocos segundos"
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-teal-500" />
      </span>
      Actualización automática
    </p>
  );
}
