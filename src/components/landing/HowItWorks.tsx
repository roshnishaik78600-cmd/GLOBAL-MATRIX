import { Link } from "@tanstack/react-router";
import { Radar, Network, ShieldCheck, ArrowRight } from "lucide-react";
import { PropagationExample } from "./PropagationExample";

const STEPS = [
  { icon: Radar, title: "Discover", text: "See important global events and disruptions." },
  { icon: Network, title: "Understand", text: "Explore affected industries, trade routes, and potential impact pathways." },
  { icon: ShieldCheck, title: "Prepare", text: "Know which suppliers to check and which indicators to watch next." },
];

const EXAMPLES = [
  {
    q: "Could a new tariff affect my import costs?",
    fact: "Which countries and goods the tariff covers, from the event record.",
    inference: "Industries that buy those goods, traced through trade links.",
    scenario: "A cost-pressure range if the tariff is passed through.",
  },
  {
    q: "Which industries could be exposed to a port disruption?",
    fact: "The chokepoint involved and the trade flows that pass through it.",
    inference: "Sectors that depend on those flows, scored with uncertainty ranges.",
    scenario: "Delay effects if the disruption lasts weeks rather than days.",
  },
  {
    q: "How might an export restriction affect downstream supply chains?",
    fact: "The restricted inputs and the exporting country.",
    inference: "Second-order impacts on industries that use those inputs.",
    scenario: "What changes if alternative suppliers ramp up or don't.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="card scroll-mt-20 p-5 sm:p-7">
      <h2 id="how-heading" className="t-card text-[var(--exec-ink)]">How GlobalMatrix works</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-lg border border-[var(--exec-hairline)] p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--exec-cyan)]/15 text-[var(--exec-cyan)]">
                <s.icon className="size-4" aria-hidden />
              </span>
              <span className="exec-label text-[var(--exec-ink-dim)]">Step {i + 1}</span>
            </div>
            <h3 className="mt-3 text-[16px] font-semibold text-[var(--exec-ink)]">{s.title}</h3>
            <p className="mt-1 text-[14px] text-[var(--exec-ink-dim)]">{s.text}</p>
          </li>
        ))}
      </ol>

      <PropagationExample />


      <h3 className="mt-8 text-[15px] font-semibold text-[var(--exec-ink)]">Questions it helps you investigate</h3>
      <p className="mt-1 text-[12px] text-[var(--exec-ink-dim)]">Illustrative examples — not real findings or predictions.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {EXAMPLES.map((e) => (
          <div key={e.q} className="rounded-lg border border-[var(--exec-hairline)] p-4">
            <p className="text-[14px] font-medium text-[var(--exec-ink)]">“{e.q}”</p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div><dt className="exec-label text-[var(--exec-cyan)]">Evidence</dt><dd className="text-[var(--exec-ink-dim)]">{e.fact}</dd></div>
              <div><dt className="exec-label text-[var(--exec-ink)]">Analytical inference</dt><dd className="text-[var(--exec-ink-dim)]">{e.inference}</dd></div>
              <div><dt className="exec-label text-[var(--exec-ink-dim)]">Hypothetical scenario</dt><dd className="text-[var(--exec-ink-dim)]">{e.scenario}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[12px] text-[var(--exec-ink-dim)]">
        The current event set is a demonstration corpus, not live news. Live economic data (World Bank, UN Comtrade, GDELT, ECB) shows its source and timestamp where connected.{" "}
        <Link to="/methodology" className="text-[var(--exec-cyan)] hover:underline">Read the methodology</Link>
      </p>
      <Link to="/pricing" className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--exec-cyan)] hover:underline">
        Compare plans <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
