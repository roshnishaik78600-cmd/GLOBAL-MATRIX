/**
 * Client-side API surface replacing the old Convex `api` object.
 *
 * Pure computations (intel, chokepoints, macroTopology) run entirely in the
 * browser against the corpus modules in src/lib/intel. User-state reads and
 * writes go straight to the browser Supabase client, scoped by auth uid.
 * Privileged work (brief generation, source refresh) is delegated to the
 * TanStack Start server functions in ./server.
 */
import { defineFn, type FnRef } from "./shim";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, requireUserId, cleanKey, watchedKeys } from "./supabase-helpers";
import * as serverFns from "./server";

import { allAssessments, networkSummary } from "@/lib/intel/engine";
import {
  corridorIndex,
  countryIndex,
  countryProfilePayload,
  industryExposure,
  industryIndex,
  industryProfilePayload,
  nodeExposure,
  type ExposureProfile,
} from "@/lib/intel/exposure";
import { SCENARIOS } from "@/lib/intel/scenarios";
import { getNode, isKnownNode } from "@/lib/intel/nodes";
import { getIndustry, INDUSTRIES } from "@/lib/intel/industries";
import { COUNTRIES } from "@/lib/intel/countries";
import { runScenario, SHOCK_LABEL, SHOCK_DESCRIPTION } from "@/lib/intel/scenario";
import {
  MAX_DEPENDENCIES,
  MAX_DEPENDENCY_ID,
  matchDependencies,
  resolveDependency,
  type DeclaredDependency,
  type DependencyMatch,
} from "@/lib/intel/profile";
import {
  CHANNELS,
  CHANNEL_LABEL,
  SOURCE_CLASS_LABEL,
  type Channel,
  type Stage,
  type EventAssessment,
} from "@/lib/intel/types";
import { SOURCES, STALE_AFTER_MS, type DataStatus } from "@/lib/sources";
import { POLL } from "@/lib/sources-poll";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                       */
/* ------------------------------------------------------------------ */

const COUPLING_CEILING = 1.8;

function sharedEventCoupling(a: ExposureProfile, b: ExposureProfile): number {
  const byEvent = new Map<string, number>();
  for (const c of a.contributions) {
    byEvent.set(c.eventId, (byEvent.get(c.eventId) ?? 0) + c.contribution);
  }
  let shared = 0;
  for (const c of b.contributions) {
    shared += Math.min(c.contribution, byEvent.get(c.eventId) ?? 0);
  }
  return Math.min(1, shared / COUPLING_CEILING);
}

function topNodesOf(a: EventAssessment, limit: number) {
  const byNode = new Map<string, number>();
  for (const pathway of a.scenario.pathways) {
    for (const exposure of pathway.exposures) {
      byNode.set(
        exposure.nodeId,
        (byNode.get(exposure.nodeId) ?? 0) +
          exposure.impact * pathway.magnitude * pathway.confidence,
      );
    }
  }
  return [...byNode.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, limit)
    .map(([nodeId, weight]) => ({
      nodeId,
      label: getNode(nodeId).label,
      short: getNode(nodeId).short,
      weight,
    }));
}

const watchedEvent = (watched: Set<string>, id: string) =>
  watched.has(id) || watched.has(`EVENT:${id}`);

/* ------------------------------------------------------------------ */
/* intel.*                                                              */
/* ------------------------------------------------------------------ */

async function detectionFeed(args: { channel?: Channel; stage?: Stage; watchlistOnly?: boolean }) {
  const watched = await watchedKeys();
  const eventKeyCount = [...watched].filter(
    (k) => k.startsWith("EVENT:") || !k.includes(":"),
  ).length;

  const all = allAssessments(SCENARIOS);
  const rows = all
    .filter((a) => !args.channel || a.channelPressure[args.channel] > 0.3)
    .filter((a) => !args.stage || a.scenario.stage === args.stage)
    .filter((a) => !args.watchlistOnly || watchedEvent(watched, a.scenario.id))
    .map((a) => ({
      id: a.scenario.id,
      reference: a.scenario.reference,
      title: a.scenario.title,
      summary: a.scenario.summary,
      stage: a.scenario.stage,
      detectedAt: a.scenario.detectedAt,
      firstSignalAt: a.scenario.firstSignalAt,
      confidence: a.scenario.confidence,
      novelty: a.scenario.novelty,
      velocity: a.scenario.velocity,
      actors: a.scenario.actors,
      regions: a.scenario.regions,
      tags: a.scenario.tags,
      signalCount: a.scenario.signals.length,
      dominantChannel: a.dominantChannel,
      channelPressure: a.channelPressure,
      score30: a.risk[30].score,
      low30: a.risk[30].low,
      high30: a.risk[30].high,
      band: a.band,
      evidenceStrength: a.evidenceStrength,
      velocitySeries: a.velocitySeries,
      topNodes: topNodesOf(a, 3),
      latestSignal: a.scenario.signals.reduce<(typeof a.scenario.signals)[number] | null>(
        (best, s) => (!best || s.observedAt > best.observedAt ? s : best),
        null,
      ),
      watched: watchedEvent(watched, a.scenario.id),
    }));

  return { rows, total: all.length, corpusSize: all.length, watchlistSize: eventKeyCount };
}

async function eventDetail(args: { eventId: string }) {
  const assessment = allAssessments(SCENARIOS).find((a) => a.scenario.id === args.eventId);
  if (!assessment) return null;

  const userId = await currentUserId();
  let watched = false;
  let annotations: { id: string; body: string; createdAt: number }[] = [];
  let brief: {
    thesis: string;
    channels: string[];
    caveats: string[];
    model: string;
    createdAt: number;
  } | null = null;

  if (userId) {
    const { data: w } = await supabase
      .from("watchlist")
      .select("event_id")
      .eq("user_id", userId)
      .in("event_id", [args.eventId, `EVENT:${args.eventId}`]);
    watched = !!(w && w.length > 0);

    const { data: a } = await supabase
      .from("annotations")
      .select("*")
      .eq("user_id", userId)
      .eq("event_id", args.eventId);
    annotations = (a ?? []).map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: Date.parse(r.created_at),
    }));

    const { data: b } = await supabase
      .from("briefs")
      .select("*")
      .eq("user_id", userId)
      .eq("event_id", args.eventId)
      .maybeSingle();
    brief = b
      ? {
          thesis: b.thesis,
          channels: b.channels,
          caveats: b.caveats,
          model: b.model,
          createdAt: Date.parse(b.created_at),
        }
      : null;
  }

  return {
    assessment,
    risk: [7, 30, 90].map((h) => assessment.risk[h]),
    watched,
    annotations,
    brief,
  };
}

async function riskBoard() {
  const all = allAssessments(SCENARIOS);
  return {
    channels: [...CHANNELS],
    rows: all.map((a) => ({
      id: a.scenario.id,
      title: a.scenario.title,
      stage: a.scenario.stage,
      dominantChannel: a.dominantChannel,
      channelPressure: a.channelPressure,
      score7: a.risk[7].score,
      score30: a.risk[30].score,
      low30: a.risk[30].low,
      high30: a.risk[30].high,
      band: a.band,
      tailScenario: a.scenario.tailScenario,
      analystNote: a.scenario.analystNote,
      uncertainty: a.uncertainty,
    })),
    summary: networkSummary(all),
  };
}

async function countryDirectory() {
  const all = allAssessments(SCENARIOS);
  const watched = await watchedKeys();
  const mark = (id: string) => watched.has(`NODE:${id}`);
  return {
    countries: countryIndex(all).map((r) => ({ ...r, watched: mark(r.nodeId) })),
    corridors: corridorIndex(all).map((r) => ({ ...r, watched: mark(r.nodeId) })),
    watchlistSize: [...watched].filter((k) => k.startsWith("NODE:")).length,
  };
}

async function signalMatrix() {
  const all = allAssessments(SCENARIOS);
  const countries = countryIndex(all);
  const corridors = corridorIndex(all).filter((c) => c.kind !== "institution");
  const profiles = new Map<string, ExposureProfile>();
  for (const row of [...countries, ...corridors])
    profiles.set(row.nodeId, nodeExposure(all, row.nodeId));

  const SUPPLY_CEILING = 0.5;
  const rows = countries.map((country) => {
    const profile = profiles.get(country.nodeId);
    const load = new Map((profile?.byChannel ?? []).map((c) => [c.channel, c.load]));
    let supply = 0;
    for (const corridor of corridors) {
      const other = profiles.get(corridor.nodeId);
      if (!other || !profile) continue;
      supply += sharedEventCoupling(other, profile) * corridor.load;
    }
    return {
      nodeId: country.nodeId,
      label: country.label,
      short: country.short,
      region: country.region,
      geopolitical: load.get("diplomatic") ?? 0,
      trade: load.get("trade") ?? 0,
      energy: load.get("energy") ?? 0,
      market: load.get("finance") ?? 0,
      supply: Math.min(1, supply / SUPPLY_CEILING),
      eventCount: country.eventCount,
      overall: country.load,
    };
  });

  return { rows: rows.sort((a, b) => b.overall - a.overall) };
}

async function eventChain(args: { eventId: string }) {
  const all = allAssessments(SCENARIOS);
  const assessment = all.find((a) => a.scenario.id === args.eventId);
  if (!assessment) return null;

  const byChannel = (channel: Channel) =>
    assessment.scenario.pathways
      .filter((p) => p.channel === channel)
      .flatMap((p) =>
        p.exposures.map((e) => ({
          nodeId: e.nodeId,
          label: getNode(e.nodeId).label,
          short: getNode(e.nodeId).short,
          channel: p.channel,
          mechanism: p.mechanism,
          lagDays: p.lagDays as [number, number],
          confidence: p.confidence,
          impact: e.impact,
          note: e.note,
        })),
      )
      .sort((a, b) => b.impact * b.confidence - a.impact * a.confidence);

  const everyNode = byChannel("trade").concat(
    byChannel("energy"),
    byChannel("finance"),
    byChannel("diplomatic"),
  );

  const countries = everyNode
    .reduce<Array<{ nodeId: string; label: string; short: string; load: number }>>((acc, row) => {
      const kind = getNode(row.nodeId).kind;
      if (kind === "chokepoint" || kind === "corridor" || kind === "institution") return acc;
      const found = acc.find((a) => a.nodeId === row.nodeId);
      if (found) found.load += row.impact * row.confidence;
      else
        acc.push({
          nodeId: row.nodeId,
          label: row.label,
          short: row.short,
          load: row.impact * row.confidence,
        });
      return acc;
    }, [])
    .sort((a, b) => b.load - a.load);

  const seenInfrastructure = new Set<string>();
  const infrastructure = everyNode
    .filter((c) => {
      const kind = getNode(c.nodeId).kind;
      if (kind !== "chokepoint" && kind !== "corridor") return false;
      if (seenInfrastructure.has(c.nodeId)) return false;
      seenInfrastructure.add(c.nodeId);
      return true;
    })
    .sort((a, b) => b.impact * b.confidence - a.impact * a.confidence)
    .slice(0, 8)
    .map((c) => ({
      ...c,
      kind: getNode(c.nodeId).kind,
      region: getNode(c.nodeId).region,
      criticality: getNode(c.nodeId).criticality,
    }));

  const infrastructureProfiles = new Map<string, ExposureProfile>();
  for (const node of infrastructure)
    infrastructureProfiles.set(node.nodeId, nodeExposure(all, node.nodeId));
  const pressByNode = new Map<string, number>();
  for (const pathway of assessment.scenario.pathways) {
    for (const exposure of pathway.exposures) {
      const node = getNode(exposure.nodeId);
      if (node.kind !== "chokepoint" && node.kind !== "corridor") continue;
      pressByNode.set(
        exposure.nodeId,
        (pressByNode.get(exposure.nodeId) ?? 0) +
          exposure.impact * pathway.magnitude * pathway.confidence,
      );
    }
  }

  const supply = countries
    .map((country) => {
      const profile = nodeExposure(all, country.nodeId);
      let via: string | null = null;
      let load = 0;
      for (const [nodeId, press] of pressByNode) {
        const infra = infrastructureProfiles.get(nodeId);
        if (!infra || press <= 0) continue;
        const coupling = sharedEventCoupling(infra, profile);
        const carried = coupling * press;
        if (carried > load) {
          load = carried;
          via = getNode(nodeId).label;
        }
      }
      return { ...country, load, via };
    })
    .filter((row) => row.load > 0)
    .sort((a, b) => b.load - a.load)
    .slice(0, 8);

  const industryReach = INDUSTRIES.map((industry) => {
    const exposure = industryExposure(all, industry);
    const share = exposure.contributions
      .filter((c) => c.eventId === assessment.scenario.id)
      .reduce((s, c) => s + c.weight, 0);
    return {
      id: industry.id,
      label: industry.label,
      share,
      channel: exposure.contributions.find((c) => c.eventId === assessment.scenario.id)?.channel,
    };
  })
    .filter((row) => row.share > 0)
    .sort((a, b) => b.share - a.share);

  return {
    event: {
      id: assessment.scenario.id,
      reference: assessment.scenario.reference,
      title: assessment.scenario.title,
      summary: assessment.scenario.summary,
      detectedAt: assessment.scenario.detectedAt,
      stage: assessment.scenario.stage,
      score: assessment.risk[30].score,
      low: assessment.risk[30].low,
      high: assessment.risk[30].high,
      band: assessment.band,
      uncertainty: assessment.uncertainty,
      confidence: assessment.confidence,
      regions: assessment.scenario.regions,
      actors: assessment.scenario.actors,
    },
    countries: countries.slice(0, 10),
    trade: byChannel("trade").slice(0, 8),
    energy: byChannel("energy").slice(0, 8),
    infrastructure,
    supply,
    industries: industryReach.slice(0, 8),
    market: byChannel("finance").slice(0, 8),
    companyReason:
      "No company filings, ownership records or issuer-level exposure data are connected, so GlobalMatrix does not name a company as affected. The link between an industry and a firm is asserted by that firm's own disclosure, and this build reads none.",
  };
}

async function countryTrends() {
  const all = allAssessments(SCENARIOS);
  let latest = "";
  for (const a of all)
    for (const s of a.scenario.signals) if (s.observedAt > latest) latest = s.observedAt;
  if (latest === "")
    return { days: [], latest: "", nodes: [] as { nodeId: string; values: number[] }[] };

  const dayMs = 24 * 60 * 60 * 1000;
  const end = Date.parse(latest);
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(new Date(end - i * dayMs).toISOString().slice(0, 10));
  const index = new Map(days.map((d, i) => [d, i]));

  const byNode = new Map<string, number[]>();
  for (const a of all) {
    const weights = new Map<string, number>();
    for (const pathway of a.scenario.pathways) {
      for (const exposure of pathway.exposures) {
        const term = exposure.impact * pathway.magnitude * pathway.confidence;
        weights.set(exposure.nodeId, (weights.get(exposure.nodeId) ?? 0) + term);
      }
    }
    for (const signal of a.scenario.signals) {
      const day = signal.observedAt.slice(0, 10);
      const slot = index.get(day);
      if (slot === undefined) continue;
      for (const [nodeId, weight] of weights) {
        const series = byNode.get(nodeId) ?? days.map(() => 0);
        series[slot] += weight;
        byNode.set(nodeId, series);
      }
    }
  }

  return {
    days,
    latest,
    nodes: [...byNode.entries()].map(([nodeId, values]) => ({ nodeId, values })),
  };
}

async function countryProfile(args: { nodeId: string }) {
  if (!isKnownNode(args.nodeId)) return null;
  const watched = await watchedKeys();
  return {
    ...countryProfilePayload(allAssessments(SCENARIOS), args.nodeId),
    watched: watched.has(`NODE:${args.nodeId}`),
  };
}

async function industryDirectory() {
  const watched = await watchedKeys();
  return {
    industries: industryIndex(allAssessments(SCENARIOS)).map((r) => ({
      ...r,
      watched: watched.has(`SECTOR:${r.id}`),
    })),
    watchlistSize: [...watched].filter((k) => k.startsWith("SECTOR:")).length,
  };
}

async function industryProfile(args: { industryId: string }) {
  const payload = industryProfilePayload(allAssessments(SCENARIOS), args.industryId);
  if (!payload) return null;
  const watched = await watchedKeys();
  return { ...payload, watched: watched.has(`SECTOR:${args.industryId}`) };
}

async function overview() {
  const all = allAssessments(SCENARIOS);
  const countries = countryIndex(all);
  const corridors = corridorIndex(all);

  const domains = CHANNELS.map((channel) => ({
    label: CHANNEL_LABEL[channel],
    value: Math.min(1, all.reduce((s, a) => s + a.channelPressure[channel], 0) / all.length),
    count: all.filter((a) => a.scenario.pathways.some((p) => p.channel === channel)).length,
  })).sort((a, b) => b.value - a.value);

  const observations = all
    .flatMap((a) =>
      a.scenario.signals.map((sig) => ({
        eventId: a.scenario.id,
        title: sig.headline,
        detail: `${sig.source} · ${SOURCE_CLASS_LABEL[sig.sourceClass]}`,
        at: sig.observedAt,
        channel: sig.channel,
        stage: a.scenario.stage,
      })),
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 14);

  const profiles = new Map<string, ExposureProfile>();
  for (const row of [...countries, ...corridors])
    profiles.set(row.nodeId, nodeExposure(all, row.nodeId));
  const flows: { from: string; to: string; weight: number }[] = [];
  for (const corridor of corridors) {
    if (corridor.kind === "institution") continue;
    const from = profiles.get(corridor.nodeId);
    if (!from) continue;
    for (const country of countries) {
      const to = profiles.get(country.nodeId);
      if (!to) continue;
      const weight = sharedEventCoupling(from, to);
      if (weight > 0.01) flows.push({ from: corridor.nodeId, to: country.nodeId, weight });
    }
  }
  flows.sort((a, b) => b.weight - a.weight);

  return {
    mapNodes: [
      ...countries.map((r) => ({
        ...r,
        kind: "economy" as const,
        criticality: getNode(r.nodeId).criticality,
      })),
      ...corridors,
    ].map((r) => ({
      nodeId: r.nodeId,
      label: r.label,
      kind: r.kind,
      load: r.load,
      eventCount: r.eventCount,
      criticality: r.criticality,
      byChannel: r.byChannel.map((c) => ({ channel: c.channel, load: c.load })),
    })),
    flows: flows.slice(0, 80),
    mapEvents: all.map((a) => {
      const primary = topNodesOf(a, 1)[0];
      return {
        id: a.scenario.id,
        label: a.scenario.title,
        nodeId: primary?.nodeId ?? "",
        score: a.risk[30].score,
        channel: a.dominantChannel,
        detectedAt: a.scenario.detectedAt,
      };
    }),
    domains,
    observations,
    topEvents: all.slice(0, 5).map((a) => ({
      id: a.scenario.id,
      reference: a.scenario.reference,
      title: a.scenario.title,
      stage: a.scenario.stage,
      detectedAt: a.scenario.detectedAt,
      firstSignalAt: a.scenario.firstSignalAt,
      confidence: a.scenario.confidence,
      signals: a.scenario.signals,
      score: a.risk[30].score,
      low: a.risk[30].low,
      high: a.risk[30].high,
      band: a.band,
      dominantChannel: a.dominantChannel,
      channelPressure: a.channelPressure,
      topNodes: topNodesOf(a, 3),
    })),
    hottestCountries: countries.slice(0, 6),
    supplyPressure: corridors
      .filter((c) => c.kind === "chokepoint" || c.kind === "corridor")
      .slice(0, 6),
    policyEvents: all
      .filter((a) =>
        a.scenario.tags.some((t) =>
          /export control|tariff|sanction|carbon|regulation|industrial policy/i.test(t),
        ),
      )
      .slice(0, 6)
      .map((a) => ({
        id: a.scenario.id,
        title: a.scenario.title,
        tags: a.scenario.tags,
        score: a.risk[30].score,
      })),
    hottestIndustries: industryIndex(all).slice(0, 6),
    summary: networkSummary(all),
    stats: {
      events: all.length,
      signals: all.reduce((s, a) => s + a.scenario.signals.length, 0),
      actors: new Set(all.flatMap((a) => a.scenario.actors)).size,
      nodes: new Set(
        all.flatMap((a) => a.scenario.pathways.flatMap((p) => p.exposures.map((e) => e.nodeId))),
      ).size,
    },
  };
}

async function eventGraph(args: { eventId: string }) {
  const assessment = allAssessments(SCENARIOS).find((a) => a.scenario.id === args.eventId);
  if (!assessment) return null;

  const nodes: { id: string; label: string; kind: string; weight: number }[] = [
    { id: assessment.scenario.id, label: "Event", kind: "Event", weight: 1 },
  ];
  const edges: { from: string; to: string; weight: number; label: string }[] = [];

  for (const pathway of assessment.scenario.pathways) {
    const channelId = `ch:${pathway.channel}`;
    nodes.push({
      id: channelId,
      label: CHANNEL_LABEL[pathway.channel],
      kind: "Channel",
      weight: pathway.magnitude,
    });
    edges.push({
      from: assessment.scenario.id,
      to: channelId,
      weight: pathway.magnitude,
      label: "propagates via",
    });
    for (const exposure of pathway.exposures) {
      nodes.push({
        id: exposure.nodeId,
        label: getNode(exposure.nodeId).label,
        kind: getNode(exposure.nodeId).kind === "chokepoint" ? "Corridor" : "Country",
        weight: exposure.impact,
      });
      edges.push({
        from: channelId,
        to: exposure.nodeId,
        weight: exposure.impact * pathway.magnitude,
        label: "exposes",
      });
    }
  }

  const merged = new Map<string, (typeof nodes)[number]>();
  for (const n of nodes) {
    const prev = merged.get(n.id);
    if (!prev || n.weight > prev.weight) merged.set(n.id, n);
  }

  return { nodes: [...merged.values()], edges };
}

async function supplyFlow(args: { industryId: string }) {
  const industry = getIndustry(args.industryId);
  if (!industry) return null;
  const all = allAssessments(SCENARIOS);
  const exposure = industryExposure(all, industry);
  const weightOf = (nodeId: string) =>
    exposure.contributions
      .filter((c) => c.viaNodeId === nodeId)
      .reduce((s, c) => s + c.contribution, 0);

  const stages = [
    { id: "input", label: "Input", nodeIds: industry.inputs.map((i) => i.nodeId) },
    { id: "route", label: "Route", nodeIds: industry.routes.map((r) => r.nodeId) },
    { id: "producer", label: "Producer", nodeIds: industry.producers.map((p) => p.nodeId) },
    { id: "consumer", label: "Consumer", nodeIds: industry.consumers.map((c) => c.nodeId) },
  ].filter((s) => s.nodeIds.length > 0);

  const edges: { from: string; to: string; weight: number }[] = [];
  for (const producer of industry.producers) {
    for (const input of industry.inputs) {
      const w = weightOf(producer.nodeId) + weightOf(input.nodeId);
      if (w > 0) edges.push({ from: "input", to: "producer", weight: w });
    }
    for (const route of industry.routes) {
      const w = weightOf(producer.nodeId) + weightOf(route.nodeId);
      if (w > 0) edges.push({ from: "route", to: "producer", weight: w });
    }
    for (const consumer of industry.consumers) {
      const w = weightOf(producer.nodeId) + weightOf(consumer.nodeId);
      if (w > 0) edges.push({ from: "producer", to: "consumer", weight: w });
    }
  }

  return {
    industry: { id: industry.id, label: industry.label },
    stages,
    edges: edges.sort((a, b) => b.weight - a.weight).slice(0, 40),
  };
}

async function scenarioMeta() {
  return {
    events: allAssessments(SCENARIOS)
      .slice(0, 12)
      .map((a) => ({
        id: a.scenario.id,
        reference: a.scenario.reference,
        title: a.scenario.title,
        stage: a.scenario.stage,
        score: a.risk[30].score,
      })),
    modes: (Object.keys(SHOCK_LABEL) as (keyof typeof SHOCK_LABEL)[]).map((mode) => ({
      mode,
      label: SHOCK_LABEL[mode],
      description: SHOCK_DESCRIPTION[mode],
    })),
  };
}

async function runScenarioQuery(args: {
  eventId: string;
  mode: "amplify" | "suppress" | "remove_node" | "decay";
  magnitude: number;
  nodeId?: string;
  horizonDays?: number;
}) {
  return runScenario({
    eventId: args.eventId,
    mode: args.mode,
    magnitude: args.magnitude,
    nodeId: args.nodeId,
    horizonDays: args.horizonDays ?? 30,
  });
}

async function corpusStats() {
  const all = allAssessments(SCENARIOS);
  const bands = all.reduce<Record<string, number>>((acc, a) => {
    acc[a.band] = (acc[a.band] ?? 0) + 1;
    return acc;
  }, {});
  return {
    events: all.length,
    signals: all.reduce((sum, a) => sum + a.scenario.signals.length, 0),
    actors: new Set(all.flatMap((a) => a.scenario.actors)).size,
    countries: COUNTRIES.filter((c) => {
      const node = getNode(c.nodeId);
      return node.lat !== undefined && node.lon !== undefined;
    }).length,
    meanScore: all.reduce((s, a) => s + a.overall, 0) / all.length,
    bands,
    nodes: new Set(
      all.flatMap((a) => a.scenario.pathways.flatMap((p) => p.exposures.map((e) => e.nodeId))),
    ).size,
  };
}

/* ------------------------------------------------------------------ */
/* chokepoints.*                                                       */
/* ------------------------------------------------------------------ */

function exposedEconomies(assessments: EventAssessment[], profile: ExposureProfile) {
  const byEvent = new Map<string, number>();
  for (const c of profile.contributions)
    byEvent.set(c.eventId, (byEvent.get(c.eventId) ?? 0) + c.contribution);
  return countryIndex(assessments)
    .map((country) => {
      const other = nodeExposure(assessments, country.nodeId);
      let shared = 0;
      for (const c of other.contributions)
        shared += Math.min(c.contribution, byEvent.get(c.eventId) ?? 0);
      return {
        nodeId: country.nodeId,
        label: country.label,
        load: country.load,
        coupling: Math.min(1, shared / COUPLING_CEILING),
      };
    })
    .filter((r) => r.coupling > 0.01)
    .sort((a, b) => b.coupling - a.coupling)
    .slice(0, 6);
}

async function chokepointBoard() {
  const all = allAssessments(SCENARIOS);
  const corridors = corridorIndex(all).filter(
    (c) => c.kind === "chokepoint" || c.kind === "corridor",
  );
  if (corridors.length === 0) return { rows: [] };

  const profiles = new Map<string, ExposureProfile>();
  for (const c of corridors) profiles.set(c.nodeId, nodeExposure(all, c.nodeId));

  const rows = corridors
    .map((c) => {
      const profile = profiles.get(c.nodeId);
      const industries = INDUSTRIES.flatMap((industry) => {
        const route = industry.routes.find((r) => r.nodeId === c.nodeId);
        const input = industry.inputs.find((i) => i.nodeId === c.nodeId);
        if (!route && !input) return [];
        const sectorExposure = industryExposure(all, industry).load;
        return [
          {
            id: industry.id,
            label: industry.label,
            share: input?.share ?? 0,
            note: (input?.note ?? route?.note ?? industry.note).slice(0, 140),
            role: (input ? "input" : "route") as "route" | "input",
            sectorLoad: sectorExposure,
          },
        ];
      }).sort((a, b) => b.share - a.share || b.sectorLoad - a.sectorLoad);

      const events = (profile?.contributions ?? []).slice(0, 6).map((e) => ({
        eventId: e.eventId,
        title: e.title,
        weight: e.contribution,
        channel: e.channel,
      }));

      const exposed = profile ? exposedEconomies(all, profile) : [];

      return {
        nodeId: c.nodeId,
        label: c.label,
        short: c.short,
        region: c.region,
        kind: c.kind,
        load: c.load,
        criticality: c.criticality,
        eventCount: c.eventCount,
        byChannel: (c.byChannel ?? []).map((ch) => ({
          channel: ch.channel,
          label: CHANNEL_LABEL[ch.channel],
          load: ch.load,
        })),
        industries,
        events,
        exposed,
      };
    })
    .sort((a, b) => b.load - a.load);

  return { rows };
}

/* ------------------------------------------------------------------ */
/* macroTopology.*                                                      */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const POLICY_TAG = /export control|tariff|sanction|carbon|regulation|industrial policy/i;

export interface TopologyCategory {
  id: string;
  label: string;
  measure: string;
  values: number[];
  ceiling: number;
  change: number;
  trend: "rising" | "falling" | "flat";
  intensity: number;
}

export interface TopologyResult {
  days: string[];
  latest: string;
  categories: TopologyCategory[];
  fragility: { values: number[]; ceiling: number; latest: number; change: number; measure: string };
}

function tailChange(values: number[]): number {
  const third = Math.max(1, Math.round(values.length / 3));
  const recent = values.slice(values.length - third);
  const prior = values.slice(values.length - third * 2, values.length - third);
  const mean = (vs: number[]) => (vs.length === 0 ? 0 : vs.reduce((s, v) => s + v, 0) / vs.length);
  return mean(recent) - mean(prior);
}

async function macroTopology(): Promise<TopologyResult> {
  const all = allAssessments(SCENARIOS);
  const empty: TopologyResult = {
    days: [],
    latest: "",
    categories: [],
    fragility: { values: [], ceiling: 0, latest: 0, change: 0, measure: "" },
  };
  if (all.length === 0) return empty;

  let latest = "";
  for (const a of all)
    for (const s of a.scenario.signals) if (s.observedAt > latest) latest = s.observedAt;
  if (latest === "") return empty;

  const end = Date.parse(latest);
  const days: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--)
    days.push(new Date(end - i * DAY_MS).toISOString().slice(0, 10));
  const slot = new Map(days.map((d, i) => [d, i]));

  const infrastructure = new Set(
    corridorIndex(all)
      .filter((c) => c.kind === "chokepoint" || c.kind === "corridor")
      .map((c) => c.nodeId),
  );
  const fragilityOf = new Map(countryIndex(all).map((c) => [c.nodeId, c.fragility]));

  const zero = () => days.map(() => 0);
  const byChannel = {} as Record<Channel, number[]>;
  for (const channel of CHANNELS) byChannel[channel] = zero();
  const supply = zero();
  const policy = zero();
  const fragilityWeighted = zero();
  const fragilityMass = zero();

  for (const a of all) {
    const channelMass = {} as Record<Channel, number>;
    for (const channel of CHANNELS) {
      channelMass[channel] = a.scenario.pathways
        .filter((p) => p.channel === channel)
        .reduce((sum, p) => sum + p.magnitude * p.confidence, 0);
    }

    const nodeWeight = new Map<string, number>();
    for (const pathway of a.scenario.pathways) {
      for (const exposure of pathway.exposures) {
        nodeWeight.set(
          exposure.nodeId,
          (nodeWeight.get(exposure.nodeId) ?? 0) +
            exposure.impact * pathway.magnitude * pathway.confidence,
        );
      }
    }
    let supplyMass = 0;
    let fragilityNum = 0;
    let fragilityDen = 0;
    for (const [nodeId, weight] of nodeWeight) {
      if (infrastructure.has(nodeId)) supplyMass += weight;
      const fragility = fragilityOf.get(nodeId);
      if (fragility !== undefined) {
        fragilityNum += weight * fragility;
        fragilityDen += weight;
      }
    }
    const policyMass = a.scenario.tags.some((t) => POLICY_TAG.test(t)) ? 1 : 0;

    for (const signal of a.scenario.signals) {
      const idx = slot.get(signal.observedAt.slice(0, 10));
      if (idx === undefined) continue;
      for (const channel of CHANNELS) byChannel[channel][idx] += channelMass[channel];
      supply[idx] += supplyMass;
      policy[idx] += policyMass;
      fragilityWeighted[idx] += fragilityNum;
      fragilityMass[idx] += fragilityDen;
    }
  }

  const raw = [
    {
      id: "trade-bottlenecks",
      label: "Trade bottlenecks",
      measure:
        "Corpus pathway mass on the trade channel, stamped on each day an event was observed.",
      values: byChannel.trade,
    },
    {
      id: "energy",
      label: "Energy",
      measure: "Corpus pathway mass on the energy channel.",
      values: byChannel.energy,
    },
    {
      id: "geopolitical",
      label: "Geopolitical stress",
      measure: "Corpus pathway mass on the diplomatic channel.",
      values: byChannel.diplomatic,
    },
    {
      id: "financial",
      label: "Financial stress",
      measure: "Corpus pathway mass on the finance channel.",
      values: byChannel.finance,
    },
    {
      id: "supply-chain",
      label: "Supply chain",
      measure:
        "Weighted exposure landing on tracked chokepoints and corridors rather than on economies.",
      values: supply,
    },
    {
      id: "policy",
      label: "Policy",
      measure:
        "Corpus events carrying a tariff, sanctions, export-control, carbon or industrial-policy tag.",
      values: policy,
    },
  ];

  const categories: TopologyCategory[] = raw.map((c) => {
    const ceiling = Math.max(...c.values, 0.0001);
    const values = c.values.map((v) => v / ceiling);
    const change = tailChange(values);
    return {
      id: c.id,
      label: c.label,
      measure: c.measure,
      values,
      ceiling,
      change,
      trend: change > 0.04 ? "rising" : change < -0.04 ? "falling" : "flat",
      intensity: values.length > 0 ? values[values.length - 1] : 0,
    };
  });

  const dailyMean = days.map((_, i) =>
    fragilityMass[i] > 0 ? fragilityWeighted[i] / fragilityMass[i] : 0,
  );
  const fragilityCeiling = Math.max(...dailyMean, 0.0001);

  return {
    days,
    latest,
    categories,
    fragility: {
      values: dailyMean.map((v) => v / fragilityCeiling),
      ceiling: fragilityCeiling,
      latest: dailyMean.length > 0 ? dailyMean[dailyMean.length - 1] / fragilityCeiling : 0,
      change: tailChange(dailyMean.map((v) => v / fragilityCeiling)),
      measure:
        "Structural fragility of tracked economies, weighted by the exposure they carry that day.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* research.* (watchlist + annotations)                                 */
/* ------------------------------------------------------------------ */

async function toggleWatch(args: { eventId: string }) {
  const userId = await requireUserId("You must be signed in to track events.");
  const eventId = cleanKey(args.eventId);

  const isEventKey = !eventId.includes(":") || eventId.startsWith("EVENT:");
  const bare = eventId.startsWith("EVENT:") ? eventId.slice("EVENT:".length) : eventId;
  const forms = isEventKey ? [...new Set([eventId, bare, `EVENT:${bare}`])] : [eventId];

  const { data: rows } = await supabase
    .from("watchlist")
    .select("id, event_id")
    .eq("user_id", userId)
    .in("event_id", forms);
  const existing = rows?.[0];

  if (existing) {
    await supabase.from("watchlist").delete().eq("id", existing.id);
    return { watched: false };
  }

  await supabase
    .from("watchlist")
    .insert({ user_id: userId, event_id: isEventKey ? `EVENT:${bare}` : eventId });
  return { watched: true };
}

async function addAnnotation(args: { eventId: string; body: string }) {
  const userId = await requireUserId("You must be signed in to annotate events.");
  const eventId = cleanKey(args.eventId);
  const body = args.body.trim();
  if (!body) throw new Error("Annotation cannot be empty.");
  if (body.length > 2000) throw new Error("Annotation is limited to 2000 characters.");
  const { error } = await supabase
    .from("annotations")
    .insert({ user_id: userId, event_id: eventId, body });
  if (error) throw error;
  return { ok: true };
}

async function deleteAnnotation(args: { annotationId: string }) {
  const userId = await requireUserId("You must be signed in to edit annotations.");
  const { data: row } = await supabase
    .from("annotations")
    .select("user_id")
    .eq("id", args.annotationId)
    .maybeSingle();
  if (!row || row.user_id !== userId) throw new Error("Not your annotation.");
  const { error } = await supabase.from("annotations").delete().eq("id", args.annotationId);
  if (error) throw error;
  return { ok: true };
}

async function watchlist() {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase.from("watchlist").select("*").eq("user_id", userId);
  return data ?? [];
}

async function annotations(args: { eventId: string }) {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("annotations")
    .select("*")
    .eq("user_id", userId)
    .eq("event_id", args.eventId);
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/* exposureProfile.*                                                    */
/* ------------------------------------------------------------------ */

export interface ExposureProfileEntry {
  id: string;
  kind: "node" | "industry";
  refId: string;
  match: DependencyMatch | null;
}

async function listProfile(): Promise<{
  signedIn: boolean;
  entries: ExposureProfileEntry[];
  declaredCount: number;
}> {
  const userId = await currentUserId();
  if (!userId) return { signedIn: false, entries: [], declaredCount: 0 };

  const { data: rows, error } = await supabase
    .from("exposure_deps")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;

  const declared: DeclaredDependency[] = (rows ?? []).map((r) => ({
    kind: r.kind as "node" | "industry",
    refId: r.ref_id,
  }));
  const matched = new Map(
    matchDependencies(declared, allAssessments(SCENARIOS)).map((m) => [`${m.kind}:${m.refId}`, m]),
  );

  const entries: ExposureProfileEntry[] = (rows ?? [])
    .map((r) => ({
      id: r.id,
      kind: r.kind as "node" | "industry",
      refId: r.ref_id,
      match: matched.get(`${r.kind}:${r.ref_id}`) ?? null,
    }))
    .sort((a, b) => (b.match?.load ?? -1) - (a.match?.load ?? -1));

  return { signedIn: true, entries, declaredCount: entries.length };
}

async function addDependency(args: { kind: "node" | "industry"; refId: string }) {
  const userId = await requireUserId("You must be signed in to save an exposure profile.");
  const refId = args.refId.trim();
  if (!refId || refId.length > MAX_DEPENDENCY_ID)
    throw new Error("That is not a valid GlobalMatrix reference.");
  if (!resolveDependency(args.kind, refId))
    throw new Error("That dependency is not tracked by the model, so it cannot be saved.");

  const { data: existing } = await supabase
    .from("exposure_deps")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", args.kind)
    .eq("ref_id", refId)
    .maybeSingle();
  if (existing) return { ok: true, id: existing.id, added: false };

  const { count } = await supabase
    .from("exposure_deps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) >= MAX_DEPENDENCIES)
    throw new Error(`An exposure profile is limited to ${MAX_DEPENDENCIES} dependencies.`);

  const { data: inserted, error } = await supabase
    .from("exposure_deps")
    .insert({ user_id: userId, kind: args.kind, ref_id: refId })
    .select("id")
    .single();
  if (error) throw error;
  return { ok: true, id: inserted.id, added: true };
}

async function removeDependency(args: { id: string }) {
  const userId = await requireUserId("You must be signed in to edit your profile.");
  const { data: row } = await supabase
    .from("exposure_deps")
    .select("user_id")
    .eq("id", args.id)
    .maybeSingle();
  if (!row || row.user_id !== userId) throw new Error("Not your exposure profile entry.");
  const { error } = await supabase.from("exposure_deps").delete().eq("id", args.id);
  if (error) throw error;
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* observations.* (reads from the verified-data cache)                  */
/* ------------------------------------------------------------------ */

type Observation = {
  sourceId: string;
  key: string;
  asOf: string;
  publishedAt?: number;
  retrievedAt: number;
  status: DataStatus;
  note?: string;
  ok: boolean;
  problem?: string;
  payload: string;
};

const DATA_STATUSES: readonly string[] = ["observed", "stale", "unavailable"];

const applyStaleness = (o: Observation): Observation =>
  o.ok && Date.now() - o.retrievedAt > (STALE_AFTER_MS[o.sourceId] ?? Infinity)
    ? { ...o, status: "stale", note: o.note ?? "Past its refresh window." }
    : o;

function toObservation(row: {
  source_id: string;
  key: string;
  as_of: string;
  published_at: string | null;
  retrieved_at: string;
  status: string;
  note: string | null;
  ok: boolean;
  problem: string | null;
  payload: string;
}): Observation {
  return {
    sourceId: row.source_id,
    key: row.key,
    asOf: row.as_of,
    publishedAt: row.published_at ? Date.parse(row.published_at) : undefined,
    retrievedAt: Date.parse(row.retrieved_at),
    status: (DATA_STATUSES.includes(row.status) ? row.status : "unavailable") as DataStatus,
    note: row.note ?? undefined,
    ok: row.ok,
    problem: row.problem ?? undefined,
    payload: row.payload,
  };
}

async function observationsQuery(args: { sourceId: string }): Promise<Observation[]> {
  const { data: rows } = await supabase
    .from("observations")
    .select("*")
    .eq("source_id", args.sourceId);
  const latest = new Map<string, Observation>();
  for (const r of rows ?? []) {
    if (!r.ok) continue;
    const obs = toObservation(r);
    const prev = latest.get(r.key);
    if (prev && prev.retrievedAt >= obs.retrievedAt) continue;
    latest.set(r.key, applyStaleness(obs));
  }
  return [...latest.values()];
}

export type SourceStatus = {
  sourceId: string;
  ok: boolean;
  status: DataStatus;
  asOf: string;
  publishedAt?: number;
  lastVerifiedAt: number;
  lastAttemptAt: number;
  readingCount: number;
  nextAttemptAt: number;
  consecutiveFailures: number;
  problem?: string;
  cadence: string;
};

type PublicSourceRun = {
  source_id: string;
  key: string;
  ok: boolean;
  retrieved_at: string;
  problem: string | null;
};
async function publicSourceRuns(): Promise<PublicSourceRun[]> {
  const { data, error } = await supabase.rpc("public_source_summary");
  if (error) throw new Error("Source status could not be loaded. Please retry.");
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.runs))
    throw new Error("Source status is unavailable.");
  return data.runs
    .filter(
      (row): row is Record<string, import("@/integrations/supabase/types").Json> =>
        !!row && typeof row === "object" && !Array.isArray(row),
    )
    .map((row) => ({
      source_id: String(row.source_id),
      key: String(row.key),
      ok: row.ok === true,
      retrieved_at: String(row.retrieved_at),
      problem: typeof row.problem === "string" ? row.problem : null,
    }));
}

async function sourceStatus(args: { sourceId: string }): Promise<SourceStatus | null> {
  if (!(args.sourceId in SOURCES)) return null;

  const { data: readings, error: readingError } = await supabase
    .from("observations")
    .select("*")
    .eq("source_id", args.sourceId);
  if (readingError) throw new Error("Source readings could not be loaded. Please retry.");
  const attempts = (await publicSourceRuns()).filter((row) => row.source_id === args.sourceId);

  const keys = new Set<string>();
  let lastVerifiedAt = 0;
  let asOf = "";
  let publishedAt: number | undefined;
  let status: DataStatus = "unavailable";
  for (const r of readings ?? []) {
    if (!r.ok) continue;
    keys.add(r.key);
    const retrievedAt = Date.parse(r.retrieved_at);
    if (retrievedAt > lastVerifiedAt) {
      lastVerifiedAt = retrievedAt;
      asOf = r.as_of;
      publishedAt = r.published_at ? Date.parse(r.published_at) : undefined;
      status = applyStaleness(toObservation(r)).status;
    }
  }

  let lastAttemptAt = 0;
  let newestFailureAt = 0;
  let problem: string | undefined;
  for (const a of attempts ?? []) {
    const retrievedAt = Date.parse(a.retrieved_at);
    if (retrievedAt > lastAttemptAt) lastAttemptAt = retrievedAt;
    if (!a.ok && a.problem && retrievedAt > newestFailureAt) {
      newestFailureAt = retrievedAt;
      problem = a.problem;
    }
  }
  if (lastVerifiedAt >= newestFailureAt) problem = undefined;

  return {
    sourceId: args.sourceId,
    ok: lastVerifiedAt > 0 && lastAttemptAt <= lastVerifiedAt,
    status: lastVerifiedAt === 0 ? "unavailable" : status,
    asOf,
    publishedAt,
    lastVerifiedAt,
    lastAttemptAt,
    readingCount: keys.size,
    nextAttemptAt: 0,
    consecutiveFailures: 0,
    problem,
    cadence: POLL[args.sourceId]?.cadence ?? "on demand",
  };
}

async function sourceHealth() {
  const { data: readings, error } = await supabase.from("observations").select("*");
  if (error) throw new Error("Source readings could not be loaded. Please retry.");
  const attempts = await publicSourceRuns();

  const bySourceReadings = new Map<string, NonNullable<typeof readings>>();
  for (const r of readings ?? []) {
    const list = bySourceReadings.get(r.source_id) ?? [];
    list.push(r);
    bySourceReadings.set(r.source_id, list);
  }
  const bySourceAttempts = new Map<string, NonNullable<typeof attempts>>();
  for (const a of attempts ?? []) {
    const list = bySourceAttempts.get(a.source_id) ?? [];
    list.push(a);
    bySourceAttempts.set(a.source_id, list);
  }

  return Object.keys(SOURCES).map((sourceId) => {
    const rows = bySourceReadings.get(sourceId) ?? [];
    const runs = bySourceAttempts.get(sourceId) ?? [];

    const perKey = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      if (!r.ok) continue;
      const prev = perKey.get(r.key);
      if (!prev || Date.parse(r.retrieved_at) > Date.parse(prev.retrieved_at)) perKey.set(r.key, r);
    }

    let lastSuccessAt = 0;
    let asOf = "";
    let publishedAt: number | undefined;
    let status: DataStatus = "unavailable";
    for (const r of perKey.values()) {
      const retrievedAt = Date.parse(r.retrieved_at);
      if (retrievedAt > lastSuccessAt) {
        lastSuccessAt = retrievedAt;
        asOf = r.as_of;
        publishedAt = r.published_at ? Date.parse(r.published_at) : undefined;
        status = applyStaleness(toObservation(r)).status;
      }
    }

    let lastAttemptAt = 0;
    let newestFailureAt = 0;
    let problem: string | undefined;
    for (const a of runs) {
      const retrievedAt = Date.parse(a.retrieved_at);
      if (retrievedAt > lastAttemptAt) lastAttemptAt = retrievedAt;
      if (!a.ok && a.problem && retrievedAt > newestFailureAt) {
        newestFailureAt = retrievedAt;
        problem = a.problem;
      }
    }
    if (lastSuccessAt >= newestFailureAt) problem = undefined;

    const neverContacted = lastAttemptAt === 0 && lastSuccessAt === 0;
    const failingNow = lastAttemptAt > lastSuccessAt;

    return {
      sourceId,
      ok: lastSuccessAt > 0 && !failingNow,
      status: lastSuccessAt === 0 ? "unavailable" : status,
      retrievedAt: lastAttemptAt,
      asOf,
      lastSuccessAt,
      lastAttemptAt,
      publishedAt,
      nextAttemptAt: 0,
      consecutiveFailures: 0,
      readingCount: perKey.size,
      cadence: POLL[sourceId]?.cadence ?? "on demand",
      problem: neverContacted ? undefined : problem,
    };
  });
}

/* ------------------------------------------------------------------ */
/* account.* / users.*                                                  */
/* ------------------------------------------------------------------ */

async function setDisplayName(args: { name: string }) {
  const name = args.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80)
    throw new Error("Name must be between 2 and 80 characters.");
  const { error } = await supabase.auth.updateUser({ data: { name } });
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    name: (data.user.user_metadata as { name?: string } | undefined)?.name ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* sources.* / brief.* — delegated to privileged server functions       */
/* ------------------------------------------------------------------ */

export interface ChokepointRow {
  nodeId: string;
  label: string;
  short: string;
  region: string;
  kind: string;
  load: number;
  criticality: number;
  eventCount: number;
  byChannel: { channel: Channel; label: string; load: number }[];
  /** Sectors that declare a dependency on this node, strongest first. */
  industries: {
    id: string;
    label: string;
    share: number;
    note: string;
    role: "route" | "input";
    sectorLoad: number;
  }[];
  /** Top events reaching this node, with the term they contribute. */
  events: { eventId: string; title: string; weight: number; channel: Channel }[];
  /** Economies most exposed to the same events as this node. */
  exposed: { nodeId: string; label: string; load: number; coupling: number }[];
}

export interface RefreshResult {
  skipped?: string;
  ran?: boolean;
  [key: string]: unknown;
}

async function refreshWith(
  fn: (opts: { data: { force?: boolean } }) => Promise<unknown>,
  args: { force?: boolean },
): Promise<RefreshResult> {
  return (await fn({ data: { force: !!args.force } })) as RefreshResult;
}

async function generateBriefAction(args: { eventId: string }) {
  return serverFns.generateBrief({ data: args });
}

/* ------------------------------------------------------------------ */
/* The api object                                                       */
/* ------------------------------------------------------------------ */

export const api = {
  intel: {
    detectionFeed: defineFn("intel.detectionFeed", detectionFeed),
    eventDetail: defineFn("intel.eventDetail", eventDetail),
    riskBoard: defineFn("intel.riskBoard", riskBoard),
    countryDirectory: defineFn("intel.countryDirectory", countryDirectory),
    signalMatrix: defineFn("intel.signalMatrix", signalMatrix),
    eventChain: defineFn("intel.eventChain", eventChain),
    countryTrends: defineFn("intel.countryTrends", countryTrends),
    countryProfile: defineFn("intel.countryProfile", countryProfile),
    industryDirectory: defineFn("intel.industryDirectory", industryDirectory),
    industryProfile: defineFn("intel.industryProfile", industryProfile),
    overview: defineFn("intel.overview", overview),
    eventGraph: defineFn("intel.eventGraph", eventGraph),
    supplyFlow: defineFn("intel.supplyFlow", supplyFlow),
    scenarioMeta: defineFn("intel.scenarioMeta", scenarioMeta),
    runScenarioQuery: defineFn("intel.runScenarioQuery", runScenarioQuery),
    corpusStats: defineFn("intel.corpusStats", corpusStats),
  },
  chokepoints: {
    chokepointBoard: defineFn("chokepoints.chokepointBoard", chokepointBoard),
  },
  macroTopology: {
    macroTopology: defineFn("macroTopology.macroTopology", macroTopology),
  },
  ecb: {
    europa: defineFn("ecb.europa", async () => ({
      fx: ECB_FX_META(),
      tenors: ECB_TENORS_META(),
    })),
  },
  observations: {
    observations: defineFn("observations.observations", observationsQuery),
    sourceStatus: defineFn("observations.sourceStatus", sourceStatus),
    sourceHealth: defineFn("observations.sourceHealth", sourceHealth),
  },
  sources: {
    refreshMacro: defineFn("sources.refreshMacro", (args: { force?: boolean }) =>
      refreshWith(serverFns.refreshMacro, args),
    ),
    refreshTrade: defineFn("sources.refreshTrade", (args: { force?: boolean }) =>
      refreshWith(serverFns.refreshTrade, args),
    ),
    refreshAttention: defineFn("sources.refreshAttention", (args: { force?: boolean }) =>
      refreshWith(serverFns.refreshAttention, args),
    ),
    refreshEcb: defineFn("sources.refreshEcb", (args: { force?: boolean }) =>
      refreshWith(serverFns.refreshEcb, args),
    ),
  },
  research: {
    toggleWatch: defineFn("research.toggleWatch", toggleWatch),
    addAnnotation: defineFn("research.addAnnotation", addAnnotation),
    deleteAnnotation: defineFn("research.deleteAnnotation", deleteAnnotation),
    watchlist: defineFn("research.watchlist", watchlist),
    annotations: defineFn("research.annotations", annotations),
  },
  exposureProfile: {
    listProfile: defineFn("exposureProfile.listProfile", listProfile),
    addDependency: defineFn("exposureProfile.addDependency", addDependency),
    removeDependency: defineFn("exposureProfile.removeDependency", removeDependency),
  },
  brief: {
    generateBrief: defineFn("brief.generateBrief", generateBriefAction),
  },
  briefs: {},
  account: {
    setDisplayName: defineFn("account.setDisplayName", setDisplayName),
  },
  users: {
    currentUser: defineFn("users.currentUser", currentUser),
  },
};

function ECB_FX_META() {
  return [];
}
function ECB_TENORS_META() {
  return [];
}

export type Api = typeof api;
export type { FnRef };
