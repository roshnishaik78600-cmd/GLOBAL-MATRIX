import { useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router-shim";
import { useQuery } from "@/lib/backend/shim";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Factory, Globe2, Landmark, Network, Package, TrendingUp } from "lucide-react";
import { api } from "@/lib/backend/api";
import type { TopologyResult } from "@/lib/backend/api";
import { CORPUS_LABEL } from "@/lib/intel/scenarios";
import { HowItWorks } from "@/components/landing/HowItWorks";
import {
  EcosystemStory,
  FiveStageStory,
  ReferenceFooter,
  ReferenceNav,
  StoryProgress,
} from "@/components/landing/ReferenceStory";
import orbit from "@/assets/intelligence-orbit.jpg";
import { ChainExplorer } from "@/components/viz/ChainExplorer";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import {
  BAND_LABEL,
  CHANNEL_LABEL,
  STAGE_LABEL,
  type Channel,
  type RiskBand,
  type Stage,
} from "@/lib/intel/types";
import { pct } from "@/lib/format";
import { SOURCES } from "@/lib/sources";
import { WorldMap, isPlottable } from "@/components/viz/WorldMap";
import { Skeleton } from "@/components/viz/core";
import { CountryDrawer } from "@/components/viz/exec/CountryDrawer";
import { useFocus } from "@/lib/focus";
import { ExecPage, FreshnessTag } from "@/components/viz/exec/system";
import { freshnessOf, relativeAge } from "@/lib/freshness";
import { loadColour } from "@/components/viz/exec/Topology";
import {
  BarPreview,
  ExploreGrid,
  GlobalPulse,
  SplitPreview,
  UnavailablePreview,
  type ExplorePanel,
} from "@/components/landing/sections";
import {
  WhatsChanging,
  TopIndustries,
  TrendingCountries,
  type TimelineEvent,
} from "@/components/landing/discovery";

/**
 * The public homepage.
 *
 * Show, then explain, then explore. The order is the argument: a headline, the
 * six numbers that summarise the world right now, the events behind them, the
 * map they land on, the mechanism that carries them, and finally the two
 * directories — countries and industries — that let a reader pick one and go
 * deep. Every section answers in under five seconds; the long form lives on the
 * pages each card links to.
 *
 * No login stands between a visitor and any of it. The console behind /app is
 * equally public; an account is only ever needed to save something.
 */
export default function Landing() {
  const data = useQuery(api.intel.overview);
  const feed = useQuery(api.intel.detectionFeed, {});
  const topology = useQuery(api.macroTopology.macroTopology) as TopologyResult | undefined;

  // Client-side navigation, so inspecting a country on the map does not throw
  // away the SPA and the shared selection along with it.
  const navigate = useNavigate();

  // The map's selection is the shared console selection, so a country picked
  // here is still selected after crossing into /app. Landing is mounted inside
  // FocusProvider like every other route.
  const { focus, setFocus } = useFocus();
  const sharedNodeId = focus?.kind === "node" ? focus.id : null;

  // The reverse must not happen: the shared focus outlives the route, so a
  // country chosen inside the console would otherwise leave the marketing page
  // with a country drawer already covering it. The map is highlighted from the
  // shared selection, but the drawer is gated on what was picked on this page.
  const [pickedHere, setPickedHere] = useState<string | null>(null);
  const selectNode = (id: string) => {
    setPickedHere(id);
    setFocus({ kind: "node", id });
  };
  const nodeId = pickedHere;

  // The map can only draw a node that has coordinates, so the count beside it
  // has to be the count of drawable nodes. Institutions such as SWIFT and the
  // institutional-portfolio node carry no location and are dropped by the map
  // before they reach the screen; counting them would put a number on the page
  // that a reader cannot match against the picture.
  const mappable = useMemo(
    () => (data?.mapNodes ?? []).filter((n) => isPlottable(n.nodeId)),
    [data],
  );

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!feed) return [];
    return [...feed.rows]
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
      .slice(0, 10)
      .map((row) => ({
        id: row.id,
        place: row.topNodes[0]?.label ?? "no dominant location",
        at: row.detectedAt,
        title: row.title,
        summary: row.summary,
        regions: row.regions,
        source: row.latestSignal?.source ?? CORPUS_LABEL,
        sourceClass: row.latestSignal?.sourceClass ?? "intel",
        // The newest signal, not the detection date: a corpus can detect an
        // event on one day and see it corroborated weeks later, and a card that
        // showed only the first would go stale while the evidence grows.
        updatedAt: row.latestSignal?.observedAt ?? row.detectedAt,
        score: row.score30,
        category: CHANNEL_LABEL[row.dominantChannel],
        status: row.band,
      }));
  }, [feed]);

  const panels = useMemo<ExplorePanel[]>(() => {
    const hot = (data?.hottestCountries ?? []).map((r) => ({
      label: r.short,
      value: r.load,
    }));
    const supply = (data?.supplyPressure ?? []).map((r) => ({
      label: r.short,
      value: r.load,
    }));
    const industry = (data?.hottestIndustries ?? []).map((r) => ({
      label: r.label,
      value: r.load,
    }));

    const financial = topology?.categories.find((c) => c.id === "financial");
    const trade = topology?.categories.find((c) => c.id === "trade-bottlenecks");

    return [
      {
        to: "/app/countries",
        label: "Countries",
        icon: Globe2,
        blurb: "Exposure, dependencies and the events that land hardest on each economy.",
        preview: <BarPreview rows={hot} />,
      },
      {
        to: "/app/companies",
        label: "Companies",
        icon: Factory,
        blurb: "Explore business exposure and dependencies.",
        preview: <UnavailablePreview />,
        unavailable: "No company filings are connected, so this is empty by design.",
      },
      {
        to: "/app/trade",
        label: "Trade",
        icon: Package,
        blurb: "Reported merchandise values, UN Comtrade.",
        preview: trade ? (
          <SplitPreview
            left={{
              label: "Bottleneck idx",
              value: (trade.intensity * 100).toFixed(0),
              tone: loadColour(trade.intensity),
            }}
            right={{
              label: "Reporters",
              value: String((data?.mapNodes ?? []).filter((n) => n.kind === "economy").length),
            }}
          />
        ) : (
          <UnavailablePreview />
        ),
      },
      {
        to: "/app/supply",
        label: "Supply chains",
        icon: Network,
        blurb: "Critical routes and the pressure moving through them.",
        // Routes first, sectors second: the corridor board is the primary
        // object on that page, with sector concentration as its context.
        preview: supply.length > 0 ? <BarPreview rows={supply} /> : <BarPreview rows={industry} />,
      },
      {
        to: "/app/markets",
        label: "Markets",
        icon: TrendingUp,
        blurb: "Reported macro context across every tracked economy.",
        preview: financial ? (
          <SplitPreview
            left={{
              label: "Finance idx",
              value: (financial.intensity * 100).toFixed(0),
              tone: loadColour(financial.intensity),
            }}
            right={{ label: "Trend", value: TREND_LABEL[financial.trend] }}
          />
        ) : (
          <UnavailablePreview />
        ),
        unavailable:
          "No price feed is connected. This shows modelled finance pressure, not quotes.",
      },
      {
        to: "/app/policy",
        label: "Policy",
        icon: Landmark,
        blurb: "Policy and regulatory change.",
        preview: <UnavailablePreview />,
        unavailable: "No policy registry is connected. Policy events are tagged in the corpus.",
      },
    ];
  }, [data, topology]);

  const mapEvents = (data?.mapEvents ?? []).filter((e) => e.nodeId !== "");

  return (
    <ExecPage className="gm-reference-home min-h-full">
      <ReferenceNav />
      <StoryProgress />

      <header id="start" className="gm-reference-hero scroll-mt-20">
        <div className="gm-reference-hero-art">
          <img
            src={orbit}
            alt="A translucent globe with a connected orbital pathway"
            width={1536}
            height={1024}
            fetchPriority="high"
          />
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="gm-reference-hero-copy"
        >
          <motion.p variants={fadeUp} className="gm-reference-eyebrow">
            GlobalMatrix / geopolitical intelligence
          </motion.p>
          <motion.h1 variants={fadeUp} className="gm-reference-title">
            See the world.
            <br />
            <span className="text-primary">Understand the impact.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground"
          >
            Trace global signals into potential supply-chain exposure.
            <br className="hidden sm:block" /> Evidence first. Connections in context.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/app">
                Explore Global Intelligence <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#trace-event">
                Follow the impact <Network />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </header>
      <FiveStageStory />
      <section
        id="world-map"
        className="gm-reference-atlas scroll-mt-20"
        aria-labelledby="atlas-heading"
      >
        <div className="gm-reference-section pb-8">
          <p className="gm-reference-eyebrow">One world. Many dependencies.</p>
          <h2 id="atlas-heading" className="gm-reference-heading">
            Every connection,
            <br />
            <span className="text-primary">in context.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
            Demonstration events · modelled exposure network
          </p>
        </div>
        <div className="gm-width px-4 sm:px-8">
          {data ? (
            <WorldMap
              nodes={data.mapNodes}
              flows={data.flows}
              events={mapEvents}
              className="map-frame"
              selected={sharedNodeId}
              onSelect={selectNode}
              onInspect={(id) => navigate(`/app/country/${id}`)}
            />
          ) : (
            <Skeleton className="map-frame w-full" />
          )}
          <HeroStats regions={mappable.length} links={data?.flows.length ?? 0} />
        </div>
      </section>
      <main className="min-w-0">
        <div className="gm-width gm-editorial flex flex-col gap-8 px-4 py-8 lg:gap-10 lg:px-8">
          <details className="border-b border-border pb-8">
            <summary className="cursor-pointer text-lg font-semibold">
              Explore all nine propagation stages
            </summary>
            <div className="mt-5">
              <ChainExplorer className="gm-story-chain" />
            </div>
          </details>
          <HowItWorks />

          {/* GLOBAL PULSE — the six numbers that summarise the world. */}
          <GlobalPulse data={topology} />

          {/* HAPPENING NOW — the events behind those numbers. */}
          {feed ? <WhatsChanging events={timeline} /> : <PulseSkeleton />}

          {/* FOLLOW THE SHOCK — the mechanism, drawn rather than asserted. */}

          <details className="border-t border-border pt-5">
            <summary className="cursor-pointer text-lg font-semibold text-foreground">
              Explore exposure, sources &amp; methodology
            </summary>
            <div className="mt-6 flex flex-col gap-8">
              {/* TRENDING COUNTRIES — pick one and go deep. */}
              <TrendingCountries
                rows={(data?.hottestCountries ?? []).map((r) => ({
                  nodeId: r.nodeId,
                  label: r.label,
                  short: r.short,
                  load: r.load,
                  topChannel: CHANNEL_LABEL[r.topChannel],
                  eventCount: r.eventCount,
                }))}
              />

              {/* TOP INDUSTRIES — the same question asked of sectors. */}
              <TopIndustries
                rows={(data?.hottestIndustries ?? []).map((r) => ({
                  id: r.id,
                  label: r.label,
                  load: r.load,
                  topChannel: CHANNEL_LABEL[r.topChannel],
                  eventCount: r.eventCount,
                }))}
              />

              {/* WHAT TO WATCH — the earliest-stage events, ranked by their own
              composite. Stage and channel are corpus facts; the section claims
              nothing about the future beyond the horizons the analysis shows. */}
              <WhatToWatch
                rows={(feed?.rows ?? [])
                  .filter((r) => r.stage === "emerging" || r.stage === "escalating")
                  .sort((a, b) => b.score30 - a.score30)
                  .slice(0, 4)}
              />

              {/* DATA & EVIDENCE — what every picture above is built from, with
              each connector's own freshness, stated on the page that uses it. */}
              <DataAndEvidence />

              {/* EXPLORE — the six panels, each previewed from the board it opens. */}
              <section>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="t-section text-[var(--exec-ink)]">Explore</h2>
                  <span className="exec-label">six ways in</span>
                </div>
                <ExploreGrid panels={panels} />
              </section>
            </div>
          </details>

          <section id="evidence" className="gm-reference-evidence scroll-mt-20">
            <p className="gm-reference-eyebrow">04 / Understand the exposure</p>
            <h2 className="gm-reference-heading mb-8 text-center">Evidence, before conclusions.</h2>
            <DataAndEvidence />
          </section>
          <section id="next-step" className="gm-reference-section scroll-mt-20">
            <p className="gm-reference-eyebrow">05 / Decide what comes next</p>
            <h2 className="gm-reference-heading">A clearer next question.</h2>
            <div className="gm-decision-paths mt-10 grid gap-6 md:grid-cols-3">
              {[
                { to: "/app/assess", label: "Review your dependencies", number: "01" },
                { to: "/app/watchlist", label: "Keep the signal in view", number: "02" },
                { to: "/app/analyst", label: "Read an evidence-led brief", number: "03" },
              ].map((item) => <Link key={item.to} to={item.to} className="border-t border-border py-6 text-left"><span className="font-mono text-xs text-primary">{item.number}</span><h3 className="mt-5 text-xl font-semibold">{item.label}</h3><ArrowRight className="mt-8 size-5" /></Link>)}
            </div>
          </section>
          <EcosystemStory />
          <PricingTeaser />

          <AccessBand />
        </div>
      </main>

      <ReferenceFooter />

      {/* Countries carry their full ten-module board here too, so a click on the
          homepage map opens the same intelligence a reader would get inside. */}
      {nodeId ? <CountryDrawer nodeId={nodeId} /> : null}
    </ExecPage>
  );
}

/* ------------------------------------------------------------------ parts -- */

/**
 * `TopologyCategory.trend` is a direction, not a series, so it is labelled with
 * the same three words the pulse uses rather than printed raw.
 */
const TREND_LABEL: Record<TopologyResult["categories"][number]["trend"], string> = {
  rising: "rising",
  falling: "falling",
  flat: "steady",
};

/**
 * The four hero numbers.
 *
 * Every figure here is counted from something real, and the basis is stated on
 * the strip itself rather than left to the reader to work out:
 *
 * - LIVE SIGNALS counts only readings from sources that are inside their own
 *   refresh window right now. A rate-limited feed contributes zero, because a
 *   number we cannot currently refresh is not a live signal.
 * - ACTIVE REGIONS counts places the map can actually draw. Institutions carry
 *   no coordinate and are excluded, so the number matches the picture above it.
 * - NETWORK LINKS counts shared-exposure couplings between those places. They
 *   are couplings, not shipping lanes or trade flows, which the caption says.
 * - LAST UPDATE is the most recent successful fetch across every connector.
 */
function HeroStats({ regions, links }: { regions: number; links: number }) {
  const health = useQuery(api.observations.sourceHealth);

  const liveReadings = (health ?? []).reduce((sum, h) => {
    if (!h.readingCount) return sum;
    return freshnessOf(h.lastSuccessAt, h.sourceId) === "live" ? sum + h.readingCount : sum;
  }, 0);

  const lastUpdate = (health ?? []).reduce((max, h) => Math.max(max, h.lastSuccessAt), 0);

  const cells = [
    { label: "Live signals", value: String(liveReadings) },
    { label: "Active regions", value: String(regions) },
    { label: "Network links", value: String(links) },
    {
      label: "Last update",
      value: relativeAge(lastUpdate) || "never",
      // A source that has never answered cannot leave this cell reading "never"
      // with no explanation, so it says why.
      note: lastUpdate ? undefined : "no connector has returned a reading yet",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="flex min-w-0 flex-col gap-2 px-1 py-1">
          <dt className="exec-label min-w-0 truncate text-[var(--exec-ink-dim)]">{cell.label}</dt>
          <dd
            className="exec-num truncate text-[1.35rem] leading-none font-semibold text-[var(--exec-ink)]"
            title={cell.note}
          >
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The shape a "what to watch" card needs, satisfied by the feed's rows. */
interface WatchRow {
  id: string;
  title: string;
  summary: string;
  stage: Stage;
  dominantChannel: Channel;
  score30: number;
  band: RiskBand;
  confidence: number;
}

/**
 * WHAT TO WATCH — the earliest-stage events, ranked by their own 30-day
 * composite.
 *
 * Only events the corpus has actually scored as emerging or escalating appear
 * here. Stage, channel, band and confidence are read straight off those rows;
 * nothing about the future is claimed beyond the horizons the event analysis
 * itself shows. With nothing at an early stage, the section says so rather
 * than filling the space with speculation.
 */
function WhatToWatch({ rows }: { rows: WatchRow[] }) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="t-section text-[var(--exec-ink)]">What to watch</h2>
        <span className="exec-label">{CORPUS_LABEL}</span>
      </div>
      {rows.length === 0 ? (
        <div className="card p-5">
          <p className="text-[13px] leading-relaxed text-[var(--exec-ink-dim)]">
            No event in the current corpus sits at an early stage. GlobalMatrix does not fill this
            space with speculation about what might happen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rows.map((row) => (
            <Link
              key={row.id}
              to={`/app/event/${row.id}`}
              className="card card-hover flex min-w-0 flex-col gap-2 p-4"
            >
              <span className="exec-label text-[var(--exec-cyan)]">
                {STAGE_LABEL[row.stage]} · {CHANNEL_LABEL[row.dominantChannel]}
              </span>
              <span className="line-clamp-2 text-[14px] leading-snug font-semibold text-[var(--exec-ink)]">
                {row.title}
              </span>
              <span className="line-clamp-3 text-[13px] leading-snug text-[var(--exec-ink-dim)]">
                {row.summary}
              </span>
              <span className="exec-label mt-auto pt-1">
                30-day {BAND_LABEL[row.band]} · confidence {pct(row.confidence)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * DATA & EVIDENCE — the connectors behind every number above, each with its
 * own freshness, on the page that uses them.
 *
 * This is the provenance contract stated where the claims are made: source,
 * freshness and how many verified readings it is currently contributing. A
 * connector that has never answered says so instead of showing a date.
 */
function DataAndEvidence() {
  const health = useQuery(api.observations.sourceHealth);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="t-section text-[var(--exec-ink)]">Data &amp; evidence</h2>
        <Link
          to="/app/data"
          className="exec-label text-[var(--exec-ink-dim)] transition-colors hover:text-[var(--exec-ink)]"
        >
          Source observatory →
        </Link>
      </div>
      <div className="card">
        {health === undefined ? (
          <p className="px-4 py-4 text-[13px] text-[var(--exec-ink-dim)]">
            Resolving connector state…
          </p>
        ) : health.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-[var(--exec-ink-dim)]">
            No connector has returned a reading yet. This page shows no estimates while that is
            true.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--exec-hairline)]">
            {health.map((h) => {
              const def = SOURCES[h.sourceId as keyof typeof SOURCES];
              const name = def?.label ?? h.sourceId.charAt(0).toUpperCase() + h.sourceId.slice(1);
              return (
                <li
                  key={h.sourceId}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--exec-ink)]">
                    {name}
                  </span>
                  <FreshnessTag freshness={freshnessOf(h.lastSuccessAt, h.sourceId)} />
                  <span className="exec-label">
                    {h.lastSuccessAt
                      ? `updated ${relativeAge(h.lastSuccessAt)}`
                      : "never connected"}
                  </span>
                  <span className="exec-label">
                    {h.readingCount} verified reading
                    {h.readingCount === 1 ? "" : "s"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Skeleton for the discovery rail while the feed resolves. */
function PulseSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-[19rem] shrink-0 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** The access band. What is public, and what an account is actually for. */
function AccessBand() {
  return (
    <section className="gm-reference-conversion">
      <h2 className="gm-reference-heading text-primary">See the connections that matter.</h2>
      <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--exec-ink-dim)]">
        Explore without signing in. Create an account to save your research.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/app">
            Explore free <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/pricing">View plans</Link>
        </Button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            title: "No sign-in needed",
            items: ["World map", "Events", "Countries", "Trade", "Markets", "Public intelligence"],
          },
          {
            title: "Sign in only to save",
            items: ["Watchlists", "Comments and reviews", "Saved analysis"],
          },
        ].map((col) => (
          <div key={col.title}>
            <p className="exec-label text-[var(--exec-ink)]">{col.title}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {col.items.map((item) => (
                <li key={item} className="chip text-[var(--exec-ink-dim)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
