import { createFileRoute, Link } from "@tanstack/react-router";
import { PRICING, formatINR } from "@/lib/commerce";
import { RequestForm } from "@/components/commerce/RequestForm";
import { PaymentSection } from "@/components/commerce/PaymentSection";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pilot Pricing — GlobalMatrix Supply-Chain Intelligence" },
      { name: "description", content: "Source-backed supply-chain risk reports and monthly monitoring for importers, manufacturers and procurement teams." },
      { property: "og:title", content: "Pilot Pricing — GlobalMatrix" },
      { property: "og:description", content: "One-time intelligence reports and monthly risk monitoring at pilot pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Plan({ plan, kind }: { plan: (typeof PRICING)["report"] | (typeof PRICING)["monitoring"]; kind: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-7">
      <span className="w-fit rounded bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">Pilot pricing</span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{plan.name}</h2>
      <p className="mt-3 text-3xl font-semibold text-foreground">
        {formatINR(plan.price)} <span className="text-sm font-normal text-muted-foreground">{plan.cadence}</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
        {plan.scope.map((s) => <li key={s} className="flex gap-2"><span className="text-primary">—</span>{s}</li>)}
      </ul>
      <p className="mt-5 text-xs text-muted-foreground">Turnaround: {plan.turnaround}</p>
      <a href={`#request-${kind}`} className="mt-5 inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Request this
      </a>
    </div>
  );
}

function Pricing() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <Link to="/" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">← GlobalMatrix</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Understand disruptions. Trace impacts. Identify your exposure.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          For importers, manufacturers and procurement teams. Every report separates verified evidence, model estimates and AI interpretation, and says plainly where data is missing.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Plan plan={PRICING.report} kind="report" />
          <Plan plan={PRICING.monitoring} kind="pilot" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Requesting does not charge you. We confirm scope by email first; payment details follow only after you agree.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link to="/app/report/$eventId" params={{ eventId: "sample" }} className="text-primary hover:underline">See an example report →</Link>
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground">Methodology & limitations</Link>
        </div>
        <section id="request-report" className="mt-14 scroll-mt-8">
          <span id="request-pilot" />
          <h2 className="text-xl font-semibold text-foreground">Request a report or pilot</h2>
          <div className="mt-4 max-w-2xl"><RequestForm defaultKind="report" /></div>
        </section>
        <section id="payment" className="mt-14 scroll-mt-8">
          <h2 className="text-xl font-semibold text-foreground">Manual UPI payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment happens by UPI once we confirm your scope by email. Below is a preview of how that payment step will look — it is not live yet.
          </p>
          <div className="mt-4 max-w-2xl"><PaymentSection /></div>
        </section>
      </div>
    </main>
  );
}
