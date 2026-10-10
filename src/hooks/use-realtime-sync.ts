import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLES = [
  "observations",
  "source_runs",
  "watchlist",
  "annotations",
  "briefs",
  "exposure_deps",
];

/** Refetch on-screen data whenever a live table changes (RLS limits what each user receives). */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => queryClient.invalidateQueries(), 400);
    };
    let channel = supabase.channel("gm-live");
    for (const table of TABLES) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
