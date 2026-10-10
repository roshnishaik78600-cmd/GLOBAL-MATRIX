import { motion, useReducedMotion } from "framer-motion";
import { Zap, Ship, Factory, Package } from "lucide-react";

// Illustrative only: a generic, unnamed scenario showing how an event can
// propagate. It is not a real event, forecast or finding.
const NODES = [
  {
    icon: Zap,
    label: "Event",
    title: "Port closure at a major chokepoint",
    kind: "Hypothetical event",
  },
  {
    icon: Ship,
    label: "Trade route",
    title: "Shipments reroute, transit times rise",
    kind: "Analytical inference",
  },
  {
    icon: Factory,
    label: "Industry",
    title: "Electronics assemblers face input delays",
    kind: "Analytical inference",
  },
  {
    icon: Package,
    label: "Your supply chain",
    title: "Check suppliers that ship through that route",
    kind: "What to investigate",
  },
];

export function PropagationExample() {
  const reduce = useReducedMotion();
  return (
    <div className="mt-8 rounded-xl border border-[var(--exec-hairline)] bg-[var(--exec-panel)]/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[var(--exec-ink)]">
          How one event can travel
        </h3>
        <span className="rounded-full border border-[var(--exec-hairline-strong)] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[var(--exec-ink-dim)]">
          Illustrative scenario — not a real event
        </span>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-4">
        {NODES.map((n, i) => (
          <motion.li
            key={n.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            className="relative rounded-lg border border-[var(--exec-hairline)] bg-[var(--exec-base)]/60 p-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--exec-cyan)]/15 text-[var(--exec-cyan)]">
                <n.icon className="size-4" aria-hidden />
              </span>
              <span className="exec-label text-[var(--exec-ink-dim)]">{n.label}</span>
            </div>
            <p className="mt-3 text-[14px] font-medium text-[var(--exec-ink)]">{n.title}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--exec-cyan)]">
              {n.kind}
            </p>
            {i < NODES.length - 1 && (
              <span
                aria-hidden
                className="absolute -right-3 top-1/2 hidden h-px w-3 bg-gradient-to-r from-[var(--exec-cyan)] to-transparent md:block"
              />
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
