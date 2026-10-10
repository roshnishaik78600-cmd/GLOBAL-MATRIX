import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { formatINR } from "@/lib/commerce";
import { PLANS, BRIEF_DAILY_LIMIT, CUSTOM_REPORT, type PlanId } from "@/lib/billing/core";
import { getMyBilling, activateFree, cancelOrder } from "@/lib/billing/billing.functions";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "Billing — GlobalMatrix account" },
      { name: "description", content: "Your GlobalMatrix plan, entitlements and order history." },
      { property: "og:title", content: "Billing — GlobalMatrix" },
      { property: "og:description", content: "Plan, entitlements and order history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Billing,
});

type Data = Awaited<ReturnType<typeof getMyBilling>>;
const fmt = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—");
const productName = (p: string) => (p === "custom_report" ? CUSTOM_REPORT.name : PLANS[p as PlanId]?.name ?? p);

function Billing() {
  const { user, loading } = useAuth() as { user: unknown; loading: boolean };
  const load = useServerFn(getMyBilling);
  const free = useServerFn(activateFree);
  const cancel = useServerFn(cancelOrder);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    load().then(setData).catch(() => setError("Could not load billing. Try again."));
  }, [load]);
  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  if (loading) return null;
  if (!user) return (
    <div className="p-8 text-sm"><p className="text-foreground">Sign in to see your plan and orders.</p>
      <Link to="/login" className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">Sign in</Link></div>
  );
  if (error) return <p role="alert" className="p-8 text-sm text-destructive">{error}</p>;
  if (!data) return <p className="p-8 text-sm text-muted-foreground">Loading billing…</p>;

  const plan = PLANS[data.plan];
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        {data.isAdmin && <Link to="/admin" className="text-sm text-primary hover:underline">Admin dashboard →</Link>}
      </div>
      {data.mode === "demo" && (
        <div role="status" className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Demo mode: payments are not enabled yet. No money is collected and no paid plan can be activated.
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Current plan</p>
        <p className="mt-2 text-xl font-semibold text-foreground">{plan.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">AI analyst briefs: {BRIEF_DAILY_LIMIT[data.plan]} per day</p>
        {data.subscription && data.plan !== "free" && (
          <p className="mt-1 text-sm text-muted-foreground">Active {fmt(data.subscription.starts_at)} – {fmt(data.subscription.expires_at)}. Renewal is manual: place a new order before expiry.</p>
        )}
        {data.subscription?.status && data.subscription.status !== "active" && (
          <p className="mt-1 text-sm text-muted-foreground">Subscription status: {data.subscription.status}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {!data.subscription && (
            <button onClick={() => free().then(refresh)} className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-accent">Activate Free Explorer</button>
          )}
          {data.plan !== "business" && <Link to="/pricing" className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground">Compare plans</Link>}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">Orders</h2>
        {data.orders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground"><tr><th className="py-2">Reference</th><th>Item</th><th>Amount</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-2 font-mono">{o.reference}</td>
                    <td>{productName(o.product)}</td>
                    <td>{formatINR(o.amount_inr)}{o.billing_period === "month" ? "/mo" : ""}</td>
                    <td>{o.status.replace(/_/g, " ")}{o.payment_mode === "demo" ? " (demo)" : ""}</td>
                    <td>{fmt(o.created_at)}</td>
                    <td>{o.status === "pending_payment" && (
                      <button className="text-xs text-muted-foreground underline" onClick={async () => {
                        if (!confirm("Cancel this order?")) return;
                        await cancel({ data: { id: o.id } }); refresh();
                      }}>Cancel</button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Invoices and receipts are not issued yet; they will appear here once payments go live.</p>
      </section>
    </div>
  );
}
