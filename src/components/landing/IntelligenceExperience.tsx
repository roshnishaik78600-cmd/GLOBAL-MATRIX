import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Bookmark,
  Globe2,
  Network,
  ScanLine,
  Sparkles,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-shim";
import globe from "@/assets/intelligence-dark.jpg";
import { EventPreview } from "./EventPreview";

const FEATURES = [
  {
    title: "Event intelligence",
    short: "Events",
    icon: ScanLine,
    to: "/app/events",
    detail:
      "Inspect the demonstration event corpus, signal history and uncertainty behind each event.",
  },
  {
    title: "Country exposure",
    short: "Countries",
    icon: Globe2,
    to: "/app/countries",
    detail: "Explore country-level modelled exposure alongside attributed economic observations.",
  },
  {
    title: "Impact graph",
    short: "Connections",
    icon: Network,
    to: "/app/graph",
    detail:
      "Select a relationship, inspect its evidence and trace how exposure travels through the network.",
  },
  {
    title: "Trade & supply",
    short: "Supply",
    icon: Package,
    to: "/app/supply",
    detail:
      "Investigate infrastructure, corridors and modelled propagation. Named supplier exposure remains unmeasured.",
  },
  {
    title: "Watchlists",
    short: "Watchlists",
    icon: Bookmark,
    to: "/app/watchlist",
    detail:
      "Save the countries and events you want to revisit. An account is required to save items.",
  },
  {
    title: "AI intelligence briefs",
    short: "AI briefs",
    icon: Sparkles,
    to: "/app/analyst",
    detail:
      "Generate an evidence-led brief within your plan allowance. Inferences are distinguished from reported observations.",
  },
];

export function IntelligenceHero() {
  const target = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 95]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.25]);
  return (
    <header ref={target} id="start" className="gm-signal-hero scroll-mt-20">
      <motion.div className="gm-signal-scene" style={reduced ? undefined : { y, scale, opacity }}>
        <img
          src={globe}
          alt="Earth with geographic boundaries and connected exposure pathways"
          width={1536}
          height={1024}
          fetchPriority="high"
        />
      </motion.div>
      <div className="gm-signal-topline">
        <span>STAGE 01 / GLOBAL SIGNAL</span>
        <span>EVENT → EXPOSURE → CONTEXT</span>
      </div>
      <div className="gm-signal-copy">
        <p className="gm-reference-eyebrow">GlobalMatrix / business exposure intelligence</p>
        <h1>
          Know what global events
          <br />
          <span>mean for your business.</span>
        </h1>
        <p className="gm-signal-description">
          Geopolitical and supply-chain exposure intelligence for Indian importers, exporters and
          risk teams.
          <br />
          Connect events to countries, industries and trade. Decide what to investigate next.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/app">
              Explore Global Intelligence <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#trace-event">
              Follow the impact <Network />
            </a>
          </Button>
        </div>
        <EventPreview />
      </div>
      <a
        href="#trace-event"
        className="gm-signal-scroll"
        aria-label="Scroll to the intelligence workflow"
      >
        <span>SCROLL TO CONNECT</span>
        <ArrowDown className="size-4" />
      </a>
      <div className="gm-signal-footnote">
        Demonstration events / attributed sources / stated uncertainty
      </div>
    </header>
  );
}

export function IntelligenceCore() {
  const [active, setActive] = useState(2);
  const selected = FEATURES[active];
  const reduced = useReducedMotion();
  return (
    <section
      id="ecosystem"
      className="gm-core-section scroll-mt-20"
      aria-labelledby="ecosystem-title"
    >
      <div className="gm-core-intro">
        <p className="gm-reference-eyebrow">06 / Integrated intelligence</p>
        <h2 id="ecosystem-title" className="gm-reference-heading">
          One signal.
          <br />A world of connections.
        </h2>
      </div>
      <div className="gm-core-composition">
        <div className="gm-core-network">
          <svg viewBox="0 0 600 480" aria-hidden="true">
            <path d="M300 240L120 75M300 240L480 75M300 240L80 240M300 240L520 240M300 240L120 405M300 240L480 405" />
          </svg>
          <div className="gm-core-center">
            <Network className="size-8" />
            <span>GlobalMatrix</span>
            <small>INTELLIGENCE CORE</small>
          </div>
          {FEATURES.map((item, index) => (
            <Button
              key={item.short}
              variant="outline"
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={`gm-core-node gm-core-node-${index}`}
            >
              <item.icon className="size-4" />
              <span>{item.short}</span>
            </Button>
          ))}
        </div>
        <motion.div
          key={active}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="gm-core-detail"
        >
          <selected.icon className="size-7 text-primary" />
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            CONNECTED CAPABILITY / 0{active + 1}
          </p>
          <h3 className="mt-4 text-3xl font-medium">{selected.title}</h3>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{selected.detail}</p>
          <Button asChild variant="outline" className="mt-8">
            <Link to={selected.to}>
              Explore {selected.short.toLowerCase()} <ArrowUpRight />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export function ProductShowcases() {
  return (
    <section className="gm-product-showcases" aria-label="Intelligence tools">
      {[
        {
          number: "01",
          title: "Look beyond the headline.",
          label: "Event intelligence",
          to: "/app/events",
          points: ["Signal history", "Source assessment", "Explicit uncertainty"],
          visual: "EVENT / EVIDENCE / EXPOSURE",
        },
        {
          number: "02",
          title: "Follow the relationships.",
          label: "Impact graph",
          to: "/app/graph",
          points: ["Connected entities", "Selectable relationships", "Evidence in context"],
          visual: "COUNTRY / INDUSTRY / PATHWAY",
        },
      ].map((item, i) => (
        <div key={item.number} className={`gm-showcase-row ${i ? "gm-showcase-reverse" : ""}`}>
          <div className="gm-showcase-copy">
            <p className="font-mono text-xs text-muted-foreground">
              {item.number} / {item.label.toUpperCase()}
            </p>
            <h2 className="mt-5 text-4xl font-medium">{item.title}</h2>
            <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
              {item.points.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="h-px w-6 bg-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-8">
              <Link to={item.to}>
                Open {item.label.toLowerCase()} <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <Link to={item.to} className="gm-showcase-visual" aria-label={`Explore ${item.label}`}>
            <span className="font-mono text-xs text-muted-foreground">{item.visual}</span>
            <div className="gm-showcase-network">
              <ScanLine />
              <span />
              <Globe2 />
              <span />
              <Network />
            </div>
            <p className="text-sm text-muted-foreground">
              {i ? "Explore the actual exposure graph" : "Read the actual event corpus"}{" "}
              <ArrowUpRight className="inline size-4" />
            </p>
          </Link>
        </div>
      ))}
    </section>
  );
}
