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
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Includes</p>
      <ul className="mt-2 space-y-1.5 text-sm text-foreground">
        {p.features.map((f) => <li key={f} className="flex gap-2"><span className="text-primary">✓</span>{f}</li>)}
      </ul>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Limits</p>
      <ul className="mt-2 flex-1 space-y-1.5 text-sm text-muted-foreground">
        {p.limits.map((f) => <li key={f} className="flex gap-2"><span>—</span>{f}</li>)}
      </ul>
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

        <section className="mt-14 grid gap-6 rounded-xl border border-border bg-card p-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">One-time service · not a subscription</span>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{CUSTOM_REPORT.name}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {CUSTOM_REPORT.deliverables.map((d) => <li key={d} className="flex gap-2"><span className="text-primary">—</span>{d}</li>)}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Work begins only after payment is verified and the scope is confirmed with you.</p>
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
