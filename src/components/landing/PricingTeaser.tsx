import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PLANS, CUSTOM_REPORT, type PlanId } from "@/lib/billing/core";
import { formatINR } from "@/lib/commerce";
import { fadeUp, hoverLift, revealProps, stagger } from "@/lib/motion";

const IDS: PlanId[] = ["free", "analyst", "business"];

/** Short pricing summary + final call to action. Prices come from the central billing config. */
export function PricingTeaser() {
  return (
    <section aria-labelledby="pricing-teaser" className="relative border-t border-border py-10">
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
        <motion.div
          variants={stagger}
          {...revealProps}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          {IDS.map((id) => (
            <motion.div
              key={id}
              variants={fadeUp}
              whileHover={hoverLift}
              className={`rounded-md border bg-card p-6 transition-colors hover:border-primary ${id === "analyst" ? "gm-plan-featured border-primary" : "border-border"}`}
            >
              <p className="text-[13px] text-[var(--exec-ink-dim)]">{PLANS[id].name}</p>
              <p className="mt-1 text-[2.25rem] font-semibold text-[var(--exec-ink)]">
                {formatINR(PLANS[id].price)}
                {PLANS[id].period && (
                  <span className="text-[13px] font-normal text-[var(--exec-ink-dim)]"> /mo</span>
                )}
              </p>
              <p className="mt-1 text-[12px] text-[var(--exec-ink-muted)]">
                {PLANS[id].limits[0] ?? PLANS[id].features[1]}
              </p>
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6"><p className="text-sm text-muted-foreground">One focused risk brief <span className="text-foreground">{formatINR(CUSTOM_REPORT.price)}</span> · one-time</p><Button asChild variant="outline"><Link to="/app/checkout/$product" params={{product: "custom_report"}}>Request a Risk Brief <ArrowRight /></Link></Button></div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link
            to="/app"
          >
            Explore Global Risks <ArrowRight className="size-4" aria-hidden />
          </Link></Button>
          <Button asChild size="lg" variant="outline"><Link
            to="/pricing"
          >
            Compare plans
          </Link></Button>
        </div>
      </div>
    </section>
  );
}
