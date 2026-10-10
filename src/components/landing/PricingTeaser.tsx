import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PLANS, CUSTOM_REPORT, type PlanId } from "@/lib/billing/core";
import { formatINR } from "@/lib/commerce";

const IDS: PlanId[] = ["free", "analyst", "business"];

/** Short pricing summary + final call to action. Prices come from the central billing config. */
export function PricingTeaser() {
  return (
    <section aria-labelledby="pricing-teaser" className="card relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden className="gm-hero-glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative">
        <h2
          id="pricing-teaser"
          className="text-[1.6rem] font-semibold text-[var(--exec-ink)] sm:text-[2rem]"
        >
          Start free. Upgrade when you need more.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] text-[var(--exec-ink-dim)]">
          Simple plans in INR. Payments are not enabled yet — no money is collected.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {IDS.map((id) => (
            <div
              key={id}
              className="rounded-xl border border-[var(--exec-hairline)] bg-[var(--exec-panel)]/70 p-4"
            >
              <p className="text-[13px] text-[var(--exec-ink-dim)]">{PLANS[id].name}</p>
              <p className="mt-1 text-[1.5rem] font-semibold text-[var(--exec-ink)]">
                {formatINR(PLANS[id].price)}
                {PLANS[id].period && (
                  <span className="text-[13px] font-normal text-[var(--exec-ink-dim)]"> /mo</span>
                )}
              </p>
              <p className="mt-1 text-[12px] text-[var(--exec-ink-muted)]">
                {PLANS[id].limits[0] ?? PLANS[id].features[1]}
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-[var(--exec-hairline)] bg-[var(--exec-panel)]/70 p-4">
            <p className="text-[13px] text-[var(--exec-ink-dim)]">Risk Brief</p>
            <p className="mt-1 text-[1.5rem] font-semibold text-[var(--exec-ink)]">
              {formatINR(CUSTOM_REPORT.price)}
            </p>
            <p className="mt-1 text-[12px] text-[var(--exec-ink-muted)]">
              One-time, no subscription
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--exec-cyan)] px-5 py-3 text-[14px] font-semibold text-[var(--exec-base)] hover:opacity-90"
          >
            Explore Global Risks <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--exec-hairline-strong)] px-5 py-3 text-[14px] font-semibold text-[var(--exec-ink)] hover:border-[var(--exec-cyan)]"
          >
            Compare plans
          </Link>
        </div>
      </div>
    </section>
  );
}
