import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { formatINR } from "@/lib/commerce";
import { MfaGate } from "@/components/admin/MfaGate";
import { supabase } from "@/integrations/supabase/client";
import { adminOverview, adminDecideOrder } from "@/lib/billing/billing.functions";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: false },
  ssr: false,
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/admin" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/admin" },
      { title: "Admin — GlobalMatrix" },
      { name: "description", content: "GlobalMatrix billing administration." },
      { property: "og:title", content: "Admin — GlobalMatrix" },
      { property: "og:description", content: "Billing administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGate,
});

type Data = Awaited<ReturnType<typeof adminOverview>>;
const TABS = [
  "Overview",
  "Verification queue",
  "Orders",
  "Subscriptions",
  "Audit history",
  "Settings",
] as const;

function AdminGate() {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);
  if (isLoading || (user && isAdmin === null)) return null;
  if (user && isAdmin)
    return (
      <MfaGate>
        <Admin />
      </MfaGate>
    );
  return <Admin />;
}

function Admin() {
  const { user, isLoading: loading } = useAuth();
  const load = useServerFn(adminOverview);
  const decide = useServerFn(adminDecideOrder);
  const [data, setData] = useState<Data | null>(null);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    load()
      .then(setData)
      .catch(() => setDenied(true));
  }, [load]);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  if (loading) return null;
  if (!user || denied)
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is limited to GlobalMatrix administrators.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary">
            Back home
          </Link>
        </div>
      </main>
    );
  if (!data) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;

  const queue = data.orders.filter((o) => o.status === "pending_verification");
  const act = async (id: string, decision: "verified" | "rejected") => {
    const reason = prompt(`Reason for marking ${decision} (required):`);
    if (!reason) return;
    if (!confirm(`Confirm: mark order ${decision}?`)) return;
    try {
      await decide({ data: { id, decision, reason } });
      setMsg("Saved.");
      refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="gm-account-page mx-auto max-w-6xl px-6 py-10">
        <Link to="/app/billing" className="text-xs text-muted-foreground">
          ← Billing
        </Link>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">Admin</h1>
        <div role="tablist" className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md border px-3 py-1.5 text-xs ${tab === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {msg && (
          <p role="status" className="mt-3 text-sm text-foreground">
            {msg}
          </p>
        )}

        <div className="mt-6">
          {tab === "Overview" && (
            <div className="grid gap-8 border-y border-border py-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Orders", data.orders.length],
                ["Awaiting verification", queue.length],
                ["Verified orders", data.orders.filter((o) => o.status === "verified").length],
                [
                  "Active paid subscriptions",
                  data.subscriptions.filter((s) => s.plan !== "free" && s.status === "active")
                    .length,
                ],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0 border-l border-border pl-5">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{v}</p>
                </div>
              ))}
            </div>
          )}
          {(tab === "Orders" || tab === "Verification queue") && (
            <Table
              rows={tab === "Orders" ? data.orders : queue}
              empty={tab === "Orders" ? "No orders yet." : "Nothing awaiting verification."}
              cols={[
                "reference",
                "product",
                "amount_inr",
                "status",
                "payment_mode",
                "upi_reference",
                "created_at",
              ]}
              action={(o) =>
                o.status === "pending_verification" ? (
                  <span className="flex gap-2">
                    <button
                      className="text-xs text-primary underline"
                      onClick={() => act(o.id as string, "verified")}
                    >
                      Approve
                    </button>
                    <button
                      className="text-xs text-destructive underline"
                      onClick={() => act(o.id as string, "rejected")}
                    >
                      Reject
                    </button>
                  </span>
                ) : null
              }
            />
          )}
          {tab === "Subscriptions" && (
            <Table
              rows={data.subscriptions}
              empty="No subscriptions yet."
              cols={["user_id", "plan", "status", "starts_at", "expires_at"]}
            />
          )}
          {tab === "Audit history" && (
            <Table
              rows={data.events}
              empty="No events yet."
              cols={["created_at", "action", "from_status", "to_status", "reason", "actor_id"]}
            />
          )}
          {tab === "Settings" && (
            <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
              <p>
                Payment mode: <strong className="text-foreground">{data.mode}</strong>{" "}
                (server-controlled; fails closed to demo).
              </p>
              <p className="mt-2">
                Prices are set in the central billing configuration in code. Demo orders can never
                be approved.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Table({
  rows,
  cols,
  empty,
  action,
}: {
  rows: Record<string, unknown>[];
  cols: string[];
  empty: string;
  action?: (r: Record<string, unknown>) => React.ReactNode;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="bg-card text-muted-foreground">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-3 py-2">
                {c.replace(/_/g, " ")}
              </th>
            ))}
            {action && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r["id"] ?? i)} className="border-t border-border text-foreground">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2">
                  {c === "amount_inr" ? formatINR(Number(r[c])) : String(r[c] ?? "—")}
                </td>
              ))}
              {action && <td className="px-3 py-2">{action(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
