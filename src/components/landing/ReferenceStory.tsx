import { useEffect, useState } from "react";
import { Link } from "@/lib/router-shim";
import { ArrowRight, ArrowUpRight, Globe2, Menu, Network, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/lib/backend/shim";
import { api } from "@/lib/backend/api";
import { buildStages } from "@/lib/intel/chain";
import { Skeleton } from "@/components/viz/core";
import { cn } from "@/lib/utils";
import orbit from "@/assets/intelligence-dark.jpg";

export const STORY_SECTIONS = [
  { id: "start", label: "See the signal" },
  { id: "trace-event", label: "Trace the event" },
  { id: "world-map", label: "Follow propagation" },
  { id: "evidence", label: "Understand exposure" },
  { id: "next-step", label: "Decide what’s next" },
  { id: "ecosystem", label: "Explore the platform" },
  { id: "pricing-teaser", label: "Choose a plan" },
];

export function ReferenceNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <>
      <nav
        className={cn(
          "gm-reference-nav sticky top-0 z-40 border-b border-border backdrop-blur-xl",
          scrolled && "is-scrolled",
        )}
        aria-label="GlobalMatrix"
      >
        <div className="gm-width flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Globe2 className="size-7 text-primary" />
            <span>GlobalMatrix</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link to="/app">Intelligence</Link>
            <a href="#ecosystem">Capabilities</a>
            <a href="#trace-event">Impact chain</a>
            <Link to="/app/data">Sources</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden lg:inline-flex">
              <Link to="/signup">
                Start exploring <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">
                Sign in <ArrowUpRight />
              </Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="grid gap-1 border-t border-border px-5 py-3 md:hidden">
            {[
              { to: "/app", label: "Intelligence" },
              { to: "/app/events", label: "Events" },
              { to: "/app/data", label: "Sources" },
              { to: "/pricing", label: "Pricing" },
              { to: "/login", label: "Sign in" },
            ].map((item) => (
              <Button key={item.to} asChild variant="ghost" className="justify-start">
                <Link to={item.to} onClick={() => setOpen(false)}>
                  {item.label}
                  <ArrowUpRight className="ml-auto" />
                </Link>
              </Button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

export function StoryProgress() {
  const [active, setActive] = useState("start");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const extent = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(extent > 0 ? Math.min(100, Math.round((window.scrollY / extent) * 100)) : 0);
      const threshold = Math.min(200, window.innerHeight * 0.25);
      let current = "start";
      for (const section of STORY_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= threshold) current = section.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
    };
  }, []);
  return (
    <nav className="gm-story-progress" aria-label="Page sections">
      {STORY_SECTIONS.map((section, index) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn("gm-progress-link", active === section.id && "is-active")}
          aria-current={active === section.id ? "location" : undefined}
          title={section.label}
        >
          <span className="gm-progress-line" />
          <span className="gm-progress-name">
            0{index + 1} {section.label}
          </span>
        </a>
      ))}
      <div className="gm-progress-readout font-mono text-xs text-muted-foreground">
        {progress}% read
      </div>
    </nav>
  );
}

const CAPABILITIES = [
  { number: "01", label: "Discover.", detail: "Events", to: "/app/events" },
  { number: "02", label: "Connect.", detail: "Impact graph", to: "/app/graph" },
  { number: "03", label: "Investigate.", detail: "Countries", to: "/app/countries" },
  { number: "04", label: "Prepare.", detail: "AI briefs", to: "/app/analyst" },
];

export function EcosystemStory() {
  return (
    <section
      id="ecosystem"
      className="gm-reference-section gm-orbital-section scroll-mt-20"
      aria-labelledby="ecosystem-title"
    >
      <p className="gm-reference-eyebrow">One connected intelligence ecosystem</p>
      <img
        src={orbit}
        alt=""
        loading="lazy"
        width={1536}
        height={1024}
        className="gm-ecosystem-orbit"
      />
      <div className="gm-ecosystem-links">
        {CAPABILITIES.map((item) => (
          <Link to={item.to} key={item.number} className="gm-ecosystem-link">
            <span className="text-primary">{item.number}</span>
            <strong>{item.label}</strong>
            <span className="ml-auto text-xs text-muted-foreground">{item.detail}</span>
            <ArrowUpRight className="size-3 text-primary" />
          </Link>
        ))}
      </div>
      <h2 id="ecosystem-title" className="gm-reference-heading">
        See the signal.
        <br />
        <span className="text-primary">Follow the connections.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Events, geography, industries and pathways — connected in one research workspace.
      </p>
    </section>
  );
}

const STAGES = [
  { title: "Global event", source: "event", question: "What changed?" },
  { title: "Evidence assessment", source: "event", question: "What is the evidence?" },
  { title: "Country & trade", source: "country", question: "Where does it land?" },
  { title: "Industry impact", source: "industry", question: "Which sectors are exposed?" },
  { title: "Supplier disruption", source: "company", question: "What remains unmeasured?" },
  { title: "Business exposure", source: null, question: "What should you investigate?" },
  { title: "Intelligence & next steps", source: null, question: "What is the next question?" },
] as const;

export function FiveStageStory({ embedded = false }: { embedded?: boolean }) {
  const reducedMotion = useReducedMotion();
  const feed = useQuery(api.intel.detectionFeed, {});
  const [eventId, setEventId] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const selected = eventId ?? feed?.rows[0]?.id;
  const chain = useQuery(api.intel.eventChain, selected ? { eventId: selected } : "skip");
  const stages = chain ? buildStages(chain) : [];
  const step = STAGES[active];
  const detail = stages.find((stage) => stage.id === step.source);
  return (
    <section
      id={embedded ? undefined : "trace-event"}
      className={cn("gm-reference-section scroll-mt-20", embedded && "gm-propagation-workbench")}
      aria-labelledby={embedded ? "workbench-title" : "impact-title"}
    >
      <p className="gm-reference-eyebrow">Seven stages. One connected story.</p>
      <h2 id={embedded ? "workbench-title" : "impact-title"} className="gm-reference-heading">
        From global change
        <br />
        to <span className="text-primary">business context.</span>
      </h2>
      <div className="mx-auto mt-8 max-w-3xl">
        <label htmlFor="story-event" className="sr-only">
          Choose an example event
        </label>
        <select
          id="story-event"
          value={selected ?? ""}
          onChange={(e) => setEventId(e.target.value)}
          className="h-11 w-full rounded-md border border-border bg-background px-4 text-sm"
        >
          {feed?.rows.map((event) => (
            <option value={event.id} key={event.id}>
              {event.reference} — {event.title}
            </option>
          ))}
        </select>
        <p className="mt-2 text-left text-xs text-muted-foreground">
          Demonstration event · analytical inferences, not a prediction
        </p>
      </div>
      <ol className="gm-five-stages mx-auto mt-10 grid max-w-5xl gap-2 md:grid-cols-7">
        {STAGES.map((stage, i) => (
          <li key={stage.title}>
            <Button
              variant="ghost"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className="gm-five-stage w-full"
            >
              <span className="font-mono text-primary">0{i + 1}</span>
              <span>{stage.title}</span>
              <ArrowRight className="ml-auto size-4" />
            </Button>
          </li>
        ))}
      </ol>
      {!chain ? (
        <Skeleton className="mx-auto mt-8 h-52 max-w-3xl" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${active}:${selected}`}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            className="gm-stage-detail mx-auto mt-8 max-w-5xl border-y border-border py-8 text-left"
          >
            <p className="font-mono text-xs text-primary">STAGE 0{active + 1}</p>
            <h3 className="mt-3 text-2xl font-semibold">{step.question}</h3>
            {active === 1 ? (
              <div className="mt-4 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Basis</p>
                  <p className="mt-2 text-sm">Demonstration corpus</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model confidence</p>
                  <p className="mt-2 text-sm">{Math.round(chain.event.confidence * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">80% score interval</p>
                  <p className="mt-2 text-sm">
                    {chain.event.low.toFixed(0)}–{chain.event.high.toFixed(0)}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:col-span-3">
                  This event is a demonstration, not verified live news. Inspect its signal history
                  and stated assumptions before interpreting the exposure.
                </p>
                <Button asChild variant="outline">
                  <Link to={`/app/event/${chain.event.id}`}>
                    Inspect event evidence <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            ) : detail ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {detail.rows[0]?.detail ?? detail.unmeasured?.reason ?? detail.about}
                </p>
                <div className="gm-propagation-nodes mt-5 grid gap-3 sm:grid-cols-3">
                  {detail.rows.slice(0, 3).map((row) =>
                    row.href ? (
                      <Button key={row.id} asChild variant="outline">
                        <Link to={row.href}>
                          {row.label}
                          <ArrowUpRight />
                        </Link>
                      </Button>
                    ) : (
                      <span key={row.id}>{row.label}</span>
                    ),
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Assess your own dependencies against this event. Supplier exposure is not
                  measured: confirm specific suppliers before making a decision.
                </p>
                <Button asChild variant="outline" className="mt-5">
                  <Link to="/app/assess">
                    Review business exposure <ArrowUpRight />
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="link" className="mt-4 px-0">
              <Link to="/app/chain">
                Open the complete propagation analysis <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}

export function ReferenceFooter() {
  return (
    <footer className="border-t border-border">
      <div className="gm-width grid gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Link to="/" className="text-lg font-semibold">
            GlobalMatrix<span className="text-primary">.</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Geopolitical and supply-chain exposure intelligence for businesses.
          </p>
        </div>
        {[
          {
            title: "Product",
            items: [
              { to: "/app", label: "Overview" },
              { to: "/app/events", label: "Events" },
              { to: "/app/graph", label: "Impact graph" },
              { to: "/app/trade", label: "Trade" },
              { to: "/pricing", label: "Pricing" },
            ],
          },
          {
            title: "Resources",
            items: [
              { to: "/methodology", label: "Methodology" },
              { to: "/app/data", label: "Data sources & timing" },
              { to: "/app/report/sample", label: "Example report" },
            ],
          },
          {
            title: "Company",
            items: [
              { to: "/about", label: "About GlobalMatrix" },
              { to: "/contact", label: "Contact" },
            ],
          },
          {
            title: "Legal & billing",
            items: [
              { to: "/privacy", label: "Privacy & data notice" },
              { to: "/terms", label: "Product & billing terms" },
              { to: "/app/billing", label: "Manage orders" },
            ],
          },
        ].map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold">{group.title}</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              {group.items.map((item) => (
                <Link key={item.to} to={item.to} className="hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="gm-width flex flex-wrap justify-between gap-3 border-t border-border px-6 py-5 text-xs text-muted-foreground">
        <span>© {new Date().getUTCFullYear()} GlobalMatrix</span>
        <span>Demonstration events · attributed economic sources · uncertainty stated</span>
      </div>
    </footer>
  );
}
