import { createFileRoute, Link } from "@tanstack/react-router";
import { SCENARIOS, CORPUS_LABEL } from "@/lib/intel/scenarios";
import { allAssessments } from "@/lib/intel/engine";
import { industryExposure } from "@/lib/intel/exposure";
import { INDUSTRIES } from "@/lib/intel/industries";
import { getNode } from "@/lib/intel/nodes";
import { BAND_LABEL, CHANNEL_LABEL, SOURCE_CLASS_LABEL, STAGE_LABEL } from "@/lib/intel/types";

export const Route = createFileRoute("/app/report/$eventId")({
  head: () => ({
    meta: [
      { title: "Intelligence Report — GlobalMatrix" },
      {
        name: "description",
        content:
          "Printable, source-attributed intelligence report: evidence, impact pathways, exposure, uncertainty and monitoring.",
      },
      { property: "og:title", content: "Intelligence Report — GlobalMatrix" },
      {
        property: "og:description",
        content: "Evidence, impact pathways, risk scores and what to monitor next for one event.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Report,
});

const pct = (n: number) => `${Math.round(n * 100)}%`;
const Tag = ({ kind }: { kind: "fact" | "model" | "analyst" }) => {
  const map = {
    fact: ["Recorded evidence", "text-primary border-primary/40"],
    model: ["Model estimate", "text-muted-foreground border-border"],
    analyst: ["Analyst interpretation", "text-accent-foreground border-accent"],
  } as const;
  return (
    <span
      className={`ml-2 rounded border px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase tracking-wider ${map[kind][1]}`}
    >
      {map[kind][0]}
    </span>
  );
};

function Section({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: "fact" | "model" | "analyst";
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid border-t border-border py-7">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
        {tag && <Tag kind={tag} />}
      </h2>
      {children}
    </section>
  );
}

function Report() {
  const { eventId } = Route.useParams();
  const all = allAssessments(SCENARIOS);
  const a =
    eventId === "sample"
      ? [...all].sort((x, y) => y.overall - x.overall)[0]
      : all.find((x) => x.scenario.id === eventId);

  if (!a) {
    return (
      <div className="p-10 text-center">
        <p className="text-foreground">
          No event with this id is in the corpus, so no report can be produced.
        </p>
        <Link to="/app/events" className="mt-3 inline-block text-primary hover:underline">
          Browse events
        </Link>
      </div>
    );
  }
  const s = a.scenario;
  const r30 = a.risk[30];
  const industries = INDUSTRIES.map((ind) => {
    const c = industryExposure(all, ind).contributions.filter((x) => x.eventId === s.id);
    return { ind, load: c.reduce((t, x) => t + x.contribution, 0), via: c[0]?.viaNodeLabel };
  })
    .filter((x) => x.load > 0)
    .sort((x, y) => y.load - x.load)
    .slice(0, 8);
  const weakSignals = s.signals.filter((g) => g.corroborations < 2);

  return (
    <article className="mx-auto max-w-4xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            GlobalMatrix intelligence report · {s.reference}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {s.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {STAGE_LABEL[s.stage]} · first signal {s.firstSignalAt.slice(0, 10)} · detected{" "}
            {s.detectedAt.slice(0, 10)} · {s.regions.join(", ")}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link
            to="/app/event/$eventId"
            params={{ eventId: s.id }}
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
          >
            Full analysis
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Print / save PDF
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        Data basis: {CORPUS_LABEL} — a synthetic, internally consistent scenario set used to
        demonstrate the method, not a live news feed. Scores come from the deterministic
        GlobalMatrix engine, not a trained prediction model. Source links are not stored in this
        corpus, so none are shown.
      </div>

      <Section title="Executive summary" tag="analyst">
        <p className="text-sm leading-relaxed text-foreground">{s.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["30-day risk", `${Math.round(r30?.score ?? a.overall)} · ${BAND_LABEL[a.band]}`],
            ["80% range", r30 ? `${Math.round(r30.low)}–${Math.round(r30.high)}` : "—"],
            ["Evidence strength", pct(a.evidenceStrength)],
            ["Main channel", CHANNEL_LABEL[a.dominantChannel]],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
              <p className="mt-1 font-mono text-sm text-foreground">{v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Evidence" tag="fact">
        {s.signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No evidence recorded — this event cannot be assessed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Date</th>
                  <th className="pr-3">Source</th>
                  <th className="pr-3">Observation</th>
                  <th className="pr-3">Reliability</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {s.signals.map((g) => (
                  <tr key={g.id} className="border-t border-border align-top">
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {g.observedAt.slice(0, 10)}
                    </td>
                    <td className="pr-3 text-foreground">
                      {g.source}
                      <div className="text-muted-foreground">
                        {SOURCE_CLASS_LABEL[g.sourceClass]}
                      </div>
                    </td>
                    <td className="pr-3 text-foreground">{g.headline}</td>
                    <td className="pr-3 font-mono">{pct(g.reliability)}</td>
                    <td
                      className={g.corroborations >= 2 ? "text-primary" : "text-muted-foreground"}
                    >
                      {g.corroborations >= 2
                        ? `Corroborated ×${g.corroborations}`
                        : "Single source"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Impact pathways" tag="model">
        <div className="space-y-5">
          {s.pathways.map((p) => (
            <div key={p.channel}>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{CHANNEL_LABEL[p.channel]}</span> — {p.mechanism}
              </p>
              <p className="text-xs text-muted-foreground">
                Pressure {pct(p.magnitude)} · lag {p.lagDays[0]}–{p.lagDays[1]} days · confidence{" "}
                {pct(p.confidence)}
              </p>
              <div className="mt-2 space-y-1">
                {[...p.exposures]
                  .sort((x, y) => y.impact - x.impact)
                  .map((e) => (
                    <div key={e.nodeId} className="flex items-center gap-3 text-xs">
                      <span className="w-36 shrink-0 truncate text-foreground">
                        {getNode(e.nodeId).label}
                      </span>
                      <div className="h-1.5 flex-1 rounded bg-muted">
                        <div
                          className="h-full rounded bg-primary"
                          style={{ width: pct(e.impact) }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-muted-foreground">
                        {pct(e.impact)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Potentially affected industries" tag="model">
        {industries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No modelled industry link for this event.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {industries.map(({ ind, load, via }) => (
              <li
                key={ind.id}
                className="flex justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {ind.label}
                  {via && <span className="text-xs text-muted-foreground"> via {via}</span>}
                </span>
                <span className="font-mono text-muted-foreground">{pct(load)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          No company-level data is connected, so no specific company is named as affected.
        </p>
      </Section>

      <Section title="Risk score & method" tag="model">
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(a.risk).map((r) => (
            <div key={r.horizonDays} className="rounded-md border border-border p-3 text-sm">
              <p className="text-xs text-muted-foreground">{r.horizonDays}-day horizon</p>
              <p className="font-mono text-foreground">
                {Math.round(r.score)}{" "}
                <span className="text-muted-foreground">
                  ({Math.round(r.low)}–{Math.round(r.high)})
                </span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Composite of source reliability, corroboration, channel pressure and network centrality
          with hand-set weights. Ranges widen with horizon.{" "}
          <Link to="/methodology" className="text-primary hover:underline">
            Full methodology
          </Link>
        </p>
      </Section>

      <Section title="Key uncertainties & alternative outcomes" tag="analyst">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
          <li>±{Math.round(a.uncertainty)} points of 30-day score uncertainty.</li>
          {weakSignals.length > 0 && (
            <li>
              {weakSignals.length} of {s.signals.length} observations rest on a single source.
            </li>
          )}
          <li>Tail scenario: {s.tailScenario}</li>
          {s.analystNote && <li>{s.analystNote}</li>}
        </ul>
      </Section>

      <Section title="What to monitor next" tag="model">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
          {s.pathways.map((p) => (
            <li key={p.channel}>
              {CHANNEL_LABEL[p.channel]}: watch for transmission within {p.lagDays[0]}–
              {p.lagDays[1]} days — {p.mechanism}
            </li>
          ))}
          {weakSignals.slice(0, 3).map((g) => (
            <li key={g.id}>Seek independent confirmation of: "{g.headline}"</li>
          ))}
        </ul>
      </Section>

      <p className="border-t border-border pt-5 text-xs text-muted-foreground print:block">
        Generated {new Date().toISOString().slice(0, 10)} · GlobalMatrix · {CORPUS_LABEL}
      </p>
    </article>
  );
}
