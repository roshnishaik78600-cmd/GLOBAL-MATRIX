import { createFileRoute, Link } from "@tanstack/react-router";
import { formatINR } from "@/lib/commerce";
import { PLANS, CUSTOM_REPORT, type PlanId } from "@/lib/billing/core";
import { RequestForm } from "@/components/commerce/RequestForm";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — GlobalMatrix Supply-Chain Intelligence" },
      { name: "description", content: "Free Explorer, Analyst ₹999/month and Business ₹4,999/month plans, plus a one-time ₹2,500 custom supply-chain risk brief." },
      { property: "og:title", content: "Pricing — GlobalMatrix" },
      { property: "og:description", content: "Clear plans with stated limits. Payments are not enabled yet — no money is collected." },
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
    click: "Opens your billing page; sign in and activate the free plan. No payment.",
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
  { row: "Price", free: "₹0", analyst: "₹999/month", business: "₹4,999/month", brief: "₹2,500 once" },
  { row: "Billing", free: "None", analyst: "Monthly, manual renewal", business: "Monthly, manual renewal", brief: "One-time" },
  { row: "Maps, events, impact & risk views", free: "✓", analyst: "✓", business: "✓", brief: "—" },
  { row: "Watchlist, notes, exposure profile", free: "✓", analyst: "✓", business: "✓", brief: "—" },
  { row: "AI analyst briefs per day", free: "5", analyst: "50", business: "200", brief: "—" },
  { row: "Analyst-written PDF for your scope", free: "—", analyst: "—", business: "—", brief: "✓" },
];

function PlanCard({ id }: { id: PlanId }) {
  const p = PLANS[id];
  const featured = id === "analyst";
  return (
    <div className={`flex flex-col rounded-xl border bg-card p-6 ${featured ? "border-primary" : "border-border"}`}>
      <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
      <p className="mt-3 text-3xl font-semibold text-foreground">
        {formatINR(p.price)}
        <span className="text-sm font-normal text-muted-foreground">{p.period ? " / month" : ""}</span>
      </p>
      <p className="mt-3 text-sm text-muted-foreground"><span className="text-foreground">For:</span> {ABOUT[id].who}</p>
      <p className="mt-1 text-sm text-muted-foreground"><span className="text-foreground">Helps you:</span> {ABOUT[id].problem}</p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Includes</p>
      <ul className="mt-2 space-y-1.5 text-sm text-foreground">
        {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-primary">✓</span>{f}</li>)}
      </ul>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Limits</p>
      <ul className="mt-2 flex-1 space-y-1.5 text-sm text-muted-foreground">
        {p.limits.map((f) => <li key={f} className="flex gap-2"><span>—</span>{f}</li>)}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground"><span className="text-foreground">When you click:</span> {ABOUT[id].click}</p>
      {id === "free" ? (
        <Link to="/app/billing" className="mt-6 inline-flex justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
          Explore Free
        </Link>
      ) : (
        <Link to="/app/checkout/$product" params={{ product: id }} className="mt-6 inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Choose {p.name}
        </Link>
      )}
    </div>
  );
}

function Pricing() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <Link to="/" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">← GlobalMatrix</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Plans and pricing</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every plan lists what it actually includes today. Prices are in Indian rupees.
        </p>
        <div role="status" className="mt-6 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <strong>Demo mode.</strong> Payments are not enabled yet. No money will be collected, and paid plans stay inactive until payment verification goes live.
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {ORDER.map((id) => <PlanCard key={id} id={id} />)}
        </div>

        <section className="mt-10" aria-labelledby="compare">
          <h2 id="compare" className="text-xl font-semibold text-foreground">Compare</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-card text-xs text-muted-foreground">
                <tr><th className="px-4 py-3" scope="col"><span className="sr-only">Feature</span></th><th scope="col">Free Explorer</th><th scope="col">Analyst</th><th scope="col">Business</th><th scope="col">Risk Brief</th></tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.row} className="border-t border-border text-foreground">
                    <th scope="row" className="px-4 py-2.5 font-normal text-muted-foreground">{r.row}</th>
                    <td>{r.free}</td><td>{r.analyst}</td><td>{r.business}</td><td>{r.brief}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">One-time service · not a subscription</span>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{CUSTOM_REPORT.name}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {CUSTOM_REPORT.deliverables.map((d) => <li key={d} className="flex gap-2"><span className="text-primary">—</span>{d}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">For: teams that need one focused analysis without a subscription. When you click: an order is created in your account; work begins only after payment is verified and the scope is confirmed with you.</p>
          </div>
          <div className="md:text-right">
            <p className="text-3xl font-semibold text-foreground">{formatINR(CUSTOM_REPORT.price)}</p>
            <p className="text-sm text-muted-foreground">one-time</p>
            <Link to="/app/checkout/$product" params={{ product: "custom_report" }} className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Order a Risk Brief
            </Link>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link to="/app/report/$eventId" params={{ eventId: "sample" }} className="text-primary hover:underline">See an example report →</Link>
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground">Methodology & limitations</Link>
        </div>

        <section id="request-report" className="mt-14 scroll-mt-8">
          <h2 className="text-xl font-semibold text-foreground">Questions or a custom scope?</h2>
          <div className="mt-4 max-w-2xl"><RequestForm defaultKind="report" /></div>
        </section>
      </div>
    </main>
  );
}
