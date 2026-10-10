import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { formatINR } from "@/lib/commerce";
import { isProduct, priceFor, PLANS, CUSTOM_REPORT, type ProductId } from "@/lib/billing/core";
import { createOrder, cancelOrder } from "@/lib/billing/billing.functions";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { DemoQr } from "@/components/commerce/DemoQr";

export const Route = createFileRoute("/app/checkout/$product")({
  head: () => ({
    meta: [
      { title: "Checkout — GlobalMatrix" },
      {
        name: "description",
        content: "Review your GlobalMatrix order summary and payment status.",
      },
      { property: "og:title", content: "Checkout — GlobalMatrix" },
      { property: "og:description", content: "Order summary and payment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Order = {
  id: string;
  reference: string;
  status: string;
  amount_inr: number;
  billing_period: string;
  payment_mode: string;
};

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
  const [retryAction, setRetryAction] = useState<"place" | "cancel">("place");

  if (!isProduct(product)) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Unknown product.{" "}
        <Link to="/pricing" className="text-primary">
          Back to pricing
        </Link>
      </div>
    );
  }
  const p = product as ProductId;
  const { amount, period } = priceFor(p);
  const name = p === "custom_report" ? CUSTOM_REPORT.name : PLANS[p].name;

  async function place() {
    setRetryAction("place");
    setBusy(true);
    setError(null);
    try {
      const r = await create({ data: { product: p } });
      setOrder(r.order as Order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function doCancel() {
    if (!order || !confirm("Cancel this order?")) return;
    setRetryAction("cancel");
    setError(null);
    setBusy(true);
    try {
      await cancel({ data: { id: order.id } });
      setOrder({ ...order, status: "cancelled" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/pricing">← Back to pricing</Link>
      </Button>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">01 / REVIEW YOUR ORDER</p>
          <h1 className="mt-2 text-3xl font-semibold">Checkout</h1>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" /> Account-linked order
        </p>
      </div>
      <div className="mt-7 grid gap-8 border-t border-border pt-7 md:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="mt-5 text-4xl font-semibold text-foreground">
            {formatINR(amount)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {period === "month" ? "/ month" : "one-time"}
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {period === "month"
              ? "Manual renewal. No automatic charges."
              : "One risk brief. Not a subscription."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Prices in INR. No other fees.</p>
          <ul className="mt-6 space-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
            <li>01 · Review the plan and amount</li>
            <li>02 · Save an order to your account</li>
            <li>03 · Payment verification before paid access</li>
          </ul>
          <div
            role="status"
            className="mt-6 border-l-2 border-warning bg-warning/10 p-4 text-sm leading-relaxed"
          >
            Demo only. No money is collected and paid access stays locked.
          </div>
        </section>
        <section className="min-w-0">
          <div className="flex flex-col items-center gap-3 border-b border-border pb-5">
            <div className="rounded-md bg-qr-paper p-4">
              <DemoQr className="block size-44 text-qr-ink" />
            </div>
            <p className="text-xs font-semibold text-warning">DEMO QR — NOT FOR PAYMENT</p>
          </div>
          {loading ? (
            <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking your account…
            </p>
          ) : !user ? (
            <div className="mt-5">
              <p className="text-sm text-muted-foreground">Sign in to save an order.</p>
              <Button asChild className="mt-4">
                <Link to="/login">
                  Sign in <ArrowRight />
                </Link>
              </Button>
            </div>
          ) : !order ? (
            <Button onClick={place} disabled={busy} className="mt-5 w-full">
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              {busy ? "Creating order…" : "Create demo order"}
            </Button>
          ) : (
            <div className="mt-5 space-y-3 text-sm">
              <p className="text-muted-foreground">Order reference</p>
              <p className="font-mono text-lg">{order.reference}</p>
              <p className="flex justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span>{STATUS_LABEL[order.status] ?? order.status}</span>
              </p>
              <p className="text-muted-foreground">
                This dummy QR has no payment destination. Your saved order does not activate a paid
                plan.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link to="/app/billing">
                    View billing <ArrowRight />
                  </Link>
                </Button>
                {order.status === "pending_payment" && (
                  <Button variant="ghost" onClick={doCancel} disabled={busy}>
                    Cancel order
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}{" "}
          <Button
            variant="link"
            onClick={retryAction === "cancel" ? doCancel : place}
            disabled={busy}
          >
            Retry
          </Button>
        </p>
      )}
    </div>
  );
}
