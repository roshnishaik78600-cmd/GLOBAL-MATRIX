import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { refreshAttention, refreshEcb, refreshMacro, refreshTrade } from "@/lib/backend/server";

/**
 * Scheduled source refresh. Each source keeps its own cooldown and claim lock
 * (claimRefresh), so a frequent schedule only actually calls publishers when
 * their per-source interval has elapsed, and concurrent runs cannot overlap.
 */
export const Route = createFileRoute("/api/public/jobs/refresh-sources")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const jobs = { ecb: refreshEcb, gdelt: refreshAttention, worldbank: refreshMacro, comtrade: refreshTrade };
        // One source per call keeps each request short; a body without a
        // source refreshes all four in turn.
        const body = (await request.json().catch(() => ({}))) as { source?: string };
        const picked = Object.entries(jobs).filter(([id]) => !body.source || id === body.source);
        if (picked.length === 0) return Response.json({ ok: false, error: "unknown source" }, { status: 400 });
        const results: Record<string, unknown> = {};
        for (const [id, fn] of picked) {
          try {
            results[id] = await fn({ data: { force: false } });
          } catch (e) {
            console.error(`[refresh-sources] ${id} failed`, e);
            results[id] = { error: "refresh failed" };
          }
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
