import { createFileRoute } from "@tanstack/react-router";

// Public liveness check. Reports only up/down state — no versions, hosts or errors.
export const Route = createFileRoute("/api/public/health")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        let database: "ok" | "unavailable" = "unavailable";
        try {
          const url = process.env["SUPABASE_URL"];
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
          if (url && key) {
            const r = await fetch(`${url}/rest/v1/rpc/public_source_summary`, {
              method: "POST",
              headers: { apikey: key, "content-type": "application/json" },
              body: "{}",
              signal: AbortSignal.timeout(3000),
            });
            if (r.ok) database = "ok";
          }
        } catch {
          database = "unavailable";
        }
        return Response.json(
          {
            status: database === "ok" ? "ok" : "degraded",
            database,
            time: new Date().toISOString(),
          },
          { status: database === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
