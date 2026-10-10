import { useState } from "react";
import { PRICING, formatINR, DEMO_PAYMENT_MODE } from "@/lib/commerce";
import { DemoQr } from "@/components/commerce/DemoQr";

type PlanId = keyof typeof PRICING;

const PLAN_LABEL: Record<PlanId, string> = {
  report: "One-time report",
  monitoring: "Monthly monitoring",
};

/**
 * Manual UPI payment section.
 *
 * While DEMO_PAYMENT_MODE is on, the QR is a decorative placeholder and the
 * payment-submission control is disabled — nothing here accepts or records a
 * payment. The rest of the page stays interactive so the flow can be previewed.
 */
export function PaymentSection() {
  const [planId, setPlanId] = useState<PlanId>("report");
  const plan = PRICING[planId];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Plan to pay for">
        {(Object.keys(PRICING) as PlanId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={planId === id}
            onClick={() => setPlanId(id)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${planId === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {PLAN_LABEL[id]} — {formatINR(PRICING[id].price)}
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 sm:grid-cols-[auto,1fr]">
        {/* The QR sits on a plain white well, the way a scannable code would.
            It is decorative: it encodes no payment destination. */}
        <div className="relative w-fit rounded-lg border border-border bg-white p-3">
          <DemoQr className="block size-44 text-neutral-900" />
          <span className="absolute inset-x-3 top-3 rounded bg-warning px-2 py-0.5 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-warning-foreground">
            Demo QR — not for payment
          </span>
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount to pay</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatINR(plan.price)}{" "}
              <span className="text-sm font-normal text-muted-foreground">{plan.cadence}</span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{plan.name}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Payment setup is coming soon. This demo QR cannot accept payments.
          </p>
          <div>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Payment submission is disabled until the real UPI QR is connected"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
            >
              Submit payment reference
              <span className="rounded bg-warning px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-warning-foreground">
                Demo mode
              </span>
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Payment submission is turned off while the payment method is not connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
