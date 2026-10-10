import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { formatINR } from "@/lib/commerce";
import { isProduct, priceFor, PLANS, CUSTOM_REPORT, type ProductId } from "@/lib/billing/core";
import { createOrder, cancelOrder } from "@/lib/billing/billing.functions";
import { DemoQr } from "@/components/commerce/DemoQr";

export const Route = createFileRoute("/app/checkout/$product")({
  head: () => ({
    meta: [
      { title: "Checkout — GlobalMatrix" },
      { name: "description", content: "Review your GlobalMatrix order summary and payment status." },
      { property: "og:title", content: "Checkout — GlobalMatrix" },
      { property: "og:description", content: "Order summary and payment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Order = { id: string; reference: string; status: string; amount_inr: number; billing_period: string; payment_mode: string };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  pending_verification: "Payment under verification",
  verified: "Verified",
  rejected: "Rejected",
  cancelled: "Cancelled",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
  draft: "Draft",
};

function Checkout() {
  const { product } = Route.useParams();
  const { user, isLoading: loading } = useAuth();
  const create = useServerFn(createOrder);
  const cancel = useServerFn(cancelOrder);
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isProduct(product)) {
    return <div className="p-8 text-sm text-muted-foreground">Unknown product. <Link to="/pricing" className="text-primary">Back to pricing</Link></div>;
  }
  const p = product as ProductId;
  const { amount, period } = priceFor(p);
  const name = p === "custom_report" ? CUSTOM_REPORT.name : PLANS[p].name;

  async function place() {
    setBusy(true); setError(null);
    try { const r = await create({ data: { product: p } }); setOrder(r.order as Order); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Try again."); }
    finally { setBusy(false); }
  }
  async function doCancel() {
    if (!order || !confirm("Cancel this order?")) return;
    setBusy(true);
    try { await cancel({ data: { id: order.id } }); setOrder({ ...order, status: "cancelled" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not cancel."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to="/pricing" className="text-xs text-muted-foreground hover:text-foreground">← Pricing</Link>
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Checkout</h1>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Order summary</p>
        <div className="mt-3 flex items-baseline justify-between gap-4">
          <span className="text-foreground">{name}</span>
          <span className="text-xl font-semibold text-foreground">{formatINR(amount)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{period === "month" ? "Billed monthly · renewal is manual, nothing is charged automatically" : "One-time payment · not a subscription"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Prices in INR. No other fees.</p>
      </div>

      <div role="status" className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
        Payments are not enabled yet. No money will be collected. Orders placed now stay unpaid and do not unlock anything.
      </div>

      {loading ? null : !user ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm">
          <p className="text-foreground">Sign in to create an order linked to your account.</p>
          <Link to="/login" className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Sign in</Link>
        </div>
      ) : !order ? (
        <button onClick={place} disabled={busy} className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {busy ? "Creating order…" : "Create order"}
        </button>
      ) : (
        <div className="mt-6 grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-[auto_1fr]">
          <div className="relative w-fit rounded-lg border border-border bg-white p-3">
            <DemoQr className="block size-40 text-neutral-900" />
            <span className="absolute inset-x-3 top-3 rounded bg-warning px-2 py-0.5 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-warning-foreground">
              Demo QR — not for payment
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Order reference</p>
            <p className="font-mono text-lg text-foreground">{order.reference}</p>
            <p><span className="text-muted-foreground">Status: </span><span className="font-medium text-foreground">{STATUS_LABEL[order.status] ?? order.status}</span></p>
            <p className="text-muted-foreground">This demo QR cannot accept payments. Your order is saved and will stay unpaid until real payment verification is enabled.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/app/billing" className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-accent">View billing</Link>
              {order.status === "pending_payment" && (
                <button onClick={doCancel} disabled={busy} className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancel order</button>
              )}
            </div>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error} <button onClick={place} className="underline">Retry</button></p>}
    </div>
  );
}
