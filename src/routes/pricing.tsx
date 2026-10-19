import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowUpRight, Compass, Network, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/commerce";
import { PLANS, CUSTOM_REPORT, BRIEF_DAILY_LIMIT, type PlanId } from "@/lib/billing/core";
import { RequestForm } from "@/components/commerce/RequestForm";
import { fadeUp, hoverLift, revealProps, stagger } from "@/lib/motion";

export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/pricing" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/pricing" },
      { title: "Pricing — GlobalMatrix Supply-Chain Intelligence" },
      {
        name: "description",
        content:
          "Free Explorer, Analyst ₹999/month and Business ₹4,999/month plans, plus a one-time ₹2,500 custom supply-chain risk brief.",
      },
      { property: "og:title", content: "Pricing — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Clear plans with stated limits. Payments are not enabled yet — no money is collected.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

const ORDER: PlanId[] = ["free", "analyst", "business"];

const ABOUT: Record<PlanId, { who: string; problem: string; click: string }> = {
  free: {
    who: "Anyone evaluating GlobalMatrix",
    problem: "See how global events connect to countries, industries and supply chains.",
    click: "Free access. Sign in to save research and manage your allowance.",
  },
  analyst: {
    who: "Individual analysts and buyers who use AI briefs often",
    problem: "Investigate more events in a day with model-written briefs.",
    click: "Creates an order in your account. In demo mode it stays unpaid and unlocks nothing.",
  },
  business: {
    who: "Procurement and risk teams with heavy daily use",
    problem: "Run many briefs a day across your tracked events.",
    click: "Creates an order in your account. In demo mode it stays unpaid and unlocks nothing.",
  },
};

const COMPARE: { row: string; free: string; analyst: string; business: string; brief: string }[] = [
  {
    row: "Price",
    free: formatINR(PLANS.free.price),
    analyst: `${formatINR(PLANS.analyst.price)}/month`,
    business: `${formatINR(PLANS.business.price)}/month`,
    brief: `${formatINR(CUSTOM_REPORT.price)} once`,
  },
  {
    row: "Billing",
    free: "None",
    analyst: "Monthly, manual renewal",
    business: "Monthly, manual renewal",
    brief: "One-time",
  },
  { row: "Maps, events, impact & risk views", free: "✓", analyst: "✓", business: "✓", brief: "—" },
  { row: "Watchlist, notes, exposure profile", free: "✓", analyst: "✓", business: "✓", brief: "—" },
  {
    row: "AI analyst briefs per day",
    free: String(BRIEF_DAILY_LIMIT.free),
    analyst: String(BRIEF_DAILY_LIMIT.analyst),
    business: String(BRIEF_DAILY_LIMIT.business),
    brief: "—",
  },
  { row: "Analyst-written PDF for your scope", free: "—", analyst: "—", business: "—", brief: "✓" },
];

function PlanCard({ id }: { id: PlanId }) {
  const p = PLANS[id];
  const featured = id === "analyst";
  return (
    <motion.div
      variants={fadeUp}
      whileHover={hoverLift}
      className={`gm-subscription-card relative flex flex-col rounded-lg border bg-card p-6 transition-shadow ${
        featured ? "gm-plan-featured border-transparent" : "border-border hover:border-primary/40"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold  text-primary-foreground uppercase">
          <Sparkles className="size-3" aria-hidden /> For deeper research
        </span>
      )}
      <div className="mb-7 flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-md border border-border text-primary">
          {id === "free" ? <Compass /> : id === "analyst" ? <Network /> : <Layers />}
        </span>
        <span className="text-xs text-muted-foreground">0{ORDER.indexOf(id) + 1}</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
      <p className="mt-3 text-4xl font-semibold  text-foreground">
        {formatINR(p.price)}
        <span className="text-sm font-normal text-muted-foreground">
          {p.period ? " / month" : ""}
        </span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{ABOUT[id].who}</p>
      <div className="gm-plan-allowance mt-5 border-y border-border py-4">
        <strong className="text-3xl font-medium">{BRIEF_DAILY_LIMIT[id]}</strong>
        <span className="ml-3 text-xs text-muted-foreground">AI briefs / day</span>
      </div>
      <p className="mt-4 font-mono text-xs uppercase r text-muted-foreground">Includes</p>
      <ul className="mt-2 space-y-1.5 text-sm text-foreground">
        {p.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-xs uppercase r text-muted-foreground">
        Daily allowance & terms
      </p>
      <ul className="mt-2 flex-1 space-y-1.5 text-sm text-muted-foreground">
        {p.limits.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden>—</span>
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">{ABOUT[id].click}</p>
      {id === "free" ? (
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/app/billing" className="mt-6">
            Explore Free <ArrowUpRight />
          </Link>
        </Button>
      ) : (
        <Button asChild className="mt-6 w-full">
          <Link to="/app/checkout/$product" params={{ product: id }} className="mt-6">
            Choose {p.name} <ArrowUpRight />
          </Link>
        </Button>
      )}
    </motion.div>
  );
}

function Pricing() {
  return (
    <main className="gm-reference-pricing min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <Link
          to="/"
          className="font-mono text-xs uppercase r text-muted-foreground hover:text-foreground"
        >
          ← GlobalMatrix
        </Link>
        <div className="gm-pricing-intro">
          <p className="gm-reference-eyebrow mt-8">Research at your pace</p>
          <h1 className="mt-8 text-3xl font-semibold  text-foreground sm:text-5xl">
            Business research.
            <br />
            At your pace.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every plan includes the same intelligence workspace. Choose the daily AI-brief allowance
            your research needs—not a different dataset.
          </p>
        </div>
        <div
          role="status"
          className="mt-6 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"
        >
          <strong>Demo mode.</strong> Payments are not enabled yet. No money will be collected, and
          paid plans stay inactive until payment verification goes live.
        </div>

        <motion.div variants={stagger} {...revealProps} className="mt-10 grid gap-5 md:grid-cols-3">
          {ORDER.map((id) => (
            <PlanCard key={id} id={id} />
          ))}
        </motion.div>

        <section className="mt-16" aria-labelledby="compare">
          <h2 id="compare" className="text-xl font-semibold text-foreground">
            Compare
          </h2>
          <div className="gm-mobile-comparison mt-4 space-y-6 md:hidden">
            {COMPARE.map((row) => (
              <div key={row.row} className="border-t border-border pt-4">
                <h3 className="text-sm font-medium">{row.row}</h3>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    ["Free Explorer", row.free],
                    ["Analyst", row.analyst],
                    ["Business", row.business],
                    ["Risk Brief", row.brief],
                  ].map(([name, value]) => (
                    <div key={name} className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">{name}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-card text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3" scope="col">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th scope="col">Free Explorer</th>
                  <th scope="col">Analyst</th>
                  <th scope="col">Business</th>
                  <th scope="col">Risk Brief</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.row} className="border-t border-border text-foreground">
                    <th scope="row" className="px-4 py-2.5 font-normal text-muted-foreground">
                      {r.row}
                    </th>
                    <td>{r.free}</td>
                    <td>{r.analyst}</td>
                    <td>{r.business}</td>
                    <td>{r.brief}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid gap-6 border-y border-border py-10 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs uppercase r text-accent-foreground">
              One-time service · not a subscription
            </span>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{CUSTOM_REPORT.name}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {CUSTOM_REPORT.deliverables.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="text-primary">—</span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              For: teams that need one focused analysis without a subscription. When you click: an
              order is created in your account; work begins only after payment is verified and the
              scope is confirmed with you.
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-3xl font-semibold text-foreground">
              {formatINR(CUSTOM_REPORT.price)}
            </p>
            <p className="text-sm text-muted-foreground">one-time</p>
            <Button asChild className="mt-4">
              <Link to="/app/checkout/$product" params={{ product: "custom_report" }}>
                Order a Risk Brief
              </Link>
            </Button>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            to="/app/report/$eventId"
            params={{ eventId: "sample" }}
            className="text-primary hover:underline"
          >
            See an example report →
          </Link>
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground">
            Methodology & limitations
          </Link>
        </div>

        <section
          className="gm-pricing-faq mt-16 border-t border-border pt-10"
          aria-labelledby="billing-questions"
        >
          <div>
            <p className="gm-reference-eyebrow">Before you choose</p>
            <h2 id="billing-questions" className="mt-5 text-3xl font-medium">
              Clear terms.
              <br />
              No surprises.
            </h2>
            <Link to="/terms" className="mt-5 inline-block text-sm text-primary">
              Product & billing terms →
            </Link>
          </div>
          <div>
            {[
              [
                "Can I pay or activate a paid plan now?",
                "No. Checkout is a demonstration. Orders remain unpaid and paid access cannot activate until live payment verification is configured. Never send money to the demo QR.",
              ],
              [
                "What changes when I choose a paid plan?",
                "The daily AI-brief allowance increases. Maps, events, country and industry views, sources and demonstration-data coverage are the same across plans.",
              ],
              [
                "Is billing automatic or annual?",
                "Neither. Paid plans use monthly manual renewal; there are no automatic charges or supported annual plans.",
              ],
              [
                "How do cancellation and downgrades work?",
                "You can cancel an eligible open order from Billing. Active subscriptions have no self-service cancellation or downgrade control yet. Without manual renewal, paid access expires and returns to Free Explorer.",
              ],
              [
                "Is this live intelligence?",
                "Event intelligence uses a demonstration corpus. Economic observations have attributed sources and their own update timing. Exposure and AI conclusions are modelled, not verified predictions. Named supplier exposure remains unmeasured.",
              ],
              [
                "Does the custom brief come with a subscription?",
                "No. It is a separate one-time service, with scope confirmation and delivery after verified payment. Demo orders do not start paid work.",
              ],
            ].map(([question, answer]) => (
              <details key={question} className="border-b border-border py-5">
                <summary className="cursor-pointer text-sm font-medium">{question}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="request-report" className="mt-14 scroll-mt-8">
          <h2 className="text-xl font-semibold text-foreground">Questions or a custom scope?</h2>
          <div className="mt-4 max-w-2xl">
            <RequestForm defaultKind="report" />
          </div>
        </section>
      </div>
    </main>
  );
}
