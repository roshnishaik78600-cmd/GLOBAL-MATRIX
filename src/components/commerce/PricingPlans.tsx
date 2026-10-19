import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Compass, Layers, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PLANS, CUSTOM_REPORT, briefLimitLabel, type PlanId } from "@/lib/billing/core";
import { formatINR } from "@/lib/commerce";
import { fadeUp, hoverLift, revealProps, stagger } from "@/lib/motion";
import { RequestForm } from "@/components/commerce/RequestForm";

const ORDER: PlanId[] = ["free", "analyst", "business"];
const ICONS = { free: Compass, analyst: Network, business: Layers };

export function PricingPlans() {
  return (
    <div className="gm-pricing-plans">
      <p role="status" className="gm-payment-notice">
        <span aria-hidden className="gm-payment-dot" />
        Payments are not enabled yet — no money is collected.
      </p>
      <motion.div variants={stagger} {...revealProps} className="gm-price-grid">
        {ORDER.map((id, index) => {
          const plan = PLANS[id];
          const Icon = ICONS[id];
          return (
            <motion.article
              key={id}
              variants={fadeUp}
              whileHover={hoverLift}
              className={`gm-price-card gm-price-card-${id}`}
              aria-label={`${plan.name} plan`}
            >
              <div className="gm-price-card-top">
                <Icon className="size-6" aria-hidden />
                <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="text-sm font-semibold uppercase">{plan.name}</h3>
              <div className="gm-price-amount">
                <strong>{formatINR(plan.price)}</strong>
                <span>{plan.period ? "/ month" : "Free to explore"}</span>
              </div>
              <div className="gm-price-capacity">
                <strong className={id === "business" ? "text-xl" : undefined}>
                  {briefLimitLabel(id)}
                </strong>
                <span>
                  AI analyst briefs
                  <br />
                  per day
                </span>
              </div>
              <p className="gm-price-coverage">
                {id === "free"
                  ? "The intelligence workspace, free."
                  : "Same data coverage as Free Explorer"}
              </p>
              <ul className="gm-price-features">
                {PLANS.free.features.slice(0, 3).map((feature) => (
                  <li key={feature}>
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="gm-price-card-action">
                {id === "free" ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/app">
                      Start Exploring <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        Join waitlist <ArrowRight aria-hidden />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{plan.name} subscriptions are not available yet</DialogTitle>
                        <DialogDescription className="pt-3 leading-relaxed">
                          Payments are not enabled yet — no money is collected. Choosing a plan does
                          not activate paid access. You can explore for free or preview the existing
                          demo checkout.
                        </DialogDescription>
                      </DialogHeader>
                      <RequestForm
                        defaultKind="waitlist"
                        fixedKind
                        defaultMessage={`Please notify me when ${plan.name} subscriptions are available.`}
                      />
                      <Button asChild>
                        <Link to="/app">
                          Start Exploring <ArrowRight aria-hidden />
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/app/checkout/$product" params={{ product: id }}>
                          Preview demo checkout
                        </Link>
                      </Button>
                      <Link
                        to="/contact"
                        className="text-center text-sm text-primary hover:underline"
                      >
                        Ask about this plan
                      </Link>
                    </DialogContent>
                  </Dialog>
                )}
                <p>
                  {id === "free"
                    ? "No subscription required"
                    : "Not available yet · manual monthly renewal"}
                </p>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
      <p className="gm-price-footnote">
        Same workspace. Same data coverage. Paid plans change the daily AI-brief allowance, not the
        dataset. Event intelligence uses demonstration data.
      </p>
    </div>
  );
}

export function RiskBriefPanel() {
  return (
    <section className="gm-risk-offer" aria-label="One-time Risk Brief">
      <div>
        <p className="font-mono text-xs uppercase text-muted-foreground">
          One-time brief · not a subscription
        </p>
        <h3>Need one focused answer?</h3>
        <p className="gm-risk-offer-price">
          One focused risk brief — <strong>{formatINR(CUSTOM_REPORT.price)}</strong>
          <span>, one-time</span>
        </p>
        <p className="gm-risk-offer-description">
          Request a focused brief on a specific geopolitical event, country, industry, or
          supply-chain exposure.
        </p>
      </div>
      <div className="gm-risk-offer-action">
        <Button asChild>
          <Link to="/app/checkout/$product" params={{ product: "custom_report" }}>
            Request a Risk Brief <ArrowRight aria-hidden />
          </Link>
        </Button>
        <p>Demo checkout only. No money collected.</p>
      </div>
    </section>
  );
}
