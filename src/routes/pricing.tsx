import { createFileRoute, Link } from "@tanstack/react-router";
import { formatINR } from "@/lib/commerce";
import { PLANS, CUSTOM_REPORT, BRIEF_DAILY_LIMIT, briefLimitLabel } from "@/lib/billing/core";
import { RequestForm } from "@/components/commerce/RequestForm";
import { PricingPlans, RiskBriefPanel } from "@/components/commerce/PricingPlans";

export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/pricing" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/pricing" },
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
  { row: "PDF export", free: "Print / save sample & event reports", analyst: "Same as Free", business: "Same as Free", brief: "Scoped PDF after verified payment" },
  { row: "Saved brief history", free: "Own generated briefs", analyst: "Own generated briefs", business: "Own generated briefs", brief: "—" },
  { row: "Email alerts, API access & team seats", free: "Not available", analyst: "Not available", business: "Not available", brief: "—" },
  {
    row: "AI analyst briefs per day",
    free: String(BRIEF_DAILY_LIMIT.free),
    analyst: String(BRIEF_DAILY_LIMIT.analyst),
    business: briefLimitLabel("business"),
    brief: "—",
  },
  { row: "Analyst-written PDF for your scope", free: "—", analyst: "—", business: "—", brief: "✓" },
];

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
        <div className="gm-pricing-intro gm-pricing-heading">
          <p className="gm-reference-eyebrow">GlobalMatrix / Plans</p>
          <h1>Start free. Upgrade when you need more.</h1>
          <p>
            Explore global risks for free. Choose a paid plan when you need more capacity or
            business support.
          </p>
        </div>
        <PricingPlans />
        <RiskBriefPanel />
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">Payments are disabled. GST treatment, tax invoices and refund terms must be confirmed before live billing; no tax invoice or refund is issued for a demo order. Prices shown are in INR.</p>

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
