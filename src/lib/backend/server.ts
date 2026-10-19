/**
 * TanStack Start server functions: privileged work (secrets, rate limits,
 * outbound fetches to external data providers, writes gated by auth).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { allAssessments } from "@/lib/intel/engine";
import { SCENARIOS, CORPUS_VERSION } from "@/lib/intel/scenarios";
import { POLL } from "@/lib/sources-poll";
import { SOURCES, STALE_AFTER_MS, type DataStatus } from "@/lib/sources";
import { ECB_FX, ECB_TENORS, readSdmx, type ConnectorOutcome } from "@/lib/ecb";

/* ------------------------------------------------------------------ */
/* Brief generation                                                    */
/* ------------------------------------------------------------------ */

const MIN_BRIEF_INTERVAL_MS = 20_000;
const MODEL = "google/gemini-3-flash-preview";
const BRIEF_TIMEOUT_MS = 45_000;
const MAX_ITEM_CHARS = 600;
const MAX_THESIS_CHARS = 2000;
const GATEWAY_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

type BriefShape = { thesis: string; channels: string[]; caveats: string[] };
type BriefFailureReason =
  | "not_signed_in"
  | "unknown_event"
  | "missing_key"
  | "rate_limited"
  | "upstream_error"
  | "empty_response"
  | "unparseable";
type BriefActionResult =
  | { ok: true; brief: BriefShape; createdAt: number }
  | { ok: false; reason: BriefFailureReason; message: string };

function buildPrompt(assessment: {
  scenario: (typeof SCENARIOS)[number];
  risk: Record<number, { score: number; low: number; high: number }>;
  channelPressure: Record<string, number>;
  dominantChannel: string;
}): string {
  const s = assessment.scenario;
  const r30 = assessment.risk[30];

  const evidence = s.signals
    .map(
      (sig) =>
        `- [${sig.sourceClass}/${sig.channel}] ${sig.observedAt} · ${sig.source}: ${sig.headline} (reliability ${(sig.reliability * 100).toFixed(0)}%, ${sig.corroborations} corroborations, ${sig.anomalyZ}σ)`,
    )
    .join("\n");

  const channels = Object.entries(assessment.channelPressure)
    .map(([channel, pressure]) => `- ${channel}: pressure ${(pressure * 100).toFixed(0)}%`)
    .join("\n");

  return [
    `EVENT: ${s.title}`,
    `REFERENCE: ${s.reference}`,
    `STAGE: ${s.stage} · confidence ${(s.confidence * 100).toFixed(0)}% · novelty ${(s.novelty * 100).toFixed(0)}%`,
    `ACTORS: ${s.actors.join(", ")}`,
    `SUMMARY: ${s.summary}`,
    ``,
    `MODEL OUTPUT (deterministic, do not contradict):`,
    `30-day risk ${r30.score.toFixed(1)} (80% interval ${r30.low.toFixed(1)}–${r30.high.toFixed(1)}), dominant channel ${assessment.dominantChannel}`,
    channels,
    ``,
    `EVIDENCE LEDGER:`,
    evidence,
    ``,
    `SCENARIO TAIL: ${s.tailScenario}`,
    ``,
    `TASK: Return STRICT JSON only, no prose outside it, with exactly these keys:`,
    `{ "thesis": string, "channels": string[], "caveats": string[] }`,
    ``,
    `Rules:`,
    `- thesis: 3-5 sentences. State the dominant transmission path and what would change the estimate.`,
    `- channels: 2-4 strings, one per material channel, each naming the transmission mechanism in one sentence.`,
    `- caveats: 3-5 strings. Each must name a specific evidentiary gap, a source-class weakness, or a falsification test.`,
    `- Cite only evidence listed above. If the evidence does not support a claim, say so in caveats.`,
  ].join("\n");
}

function cleanList(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim().slice(0, MAX_ITEM_CHARS))
    .slice(0, max);
}

export function validateBriefInput(d: unknown): { eventId: string } {
  const id = (d as { eventId?: unknown } | null)?.eventId;
  if (typeof id !== "string" || !/^[A-Za-z0-9_.:-]{1,100}$/.test(id)) {
    throw new Error("Invalid event id");
  }
  return { eventId: id };
}

export function validateRefreshInput(d: unknown): { force: boolean } {
  const f = (d as { force?: unknown } | null | undefined)?.force;
  return { force: f === true };
}

export function parseBrief(text: string): BriefShape | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<BriefShape>;
    if (typeof parsed.thesis !== "string" || !parsed.thesis.trim()) return null;
    return {
      thesis: parsed.thesis.trim().slice(0, MAX_THESIS_CHARS),
      channels: cleanList(parsed.channels, 4),
      caveats: cleanList(parsed.caveats, 5),
    };
  } catch {
    return null;
  }
}

export const generateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(validateBriefInput)
  .handler(async ({ data, context }): Promise<BriefActionResult> => {
    const userId = context.userId as string;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const assessment = allAssessments(SCENARIOS).find((a) => a.scenario.id === data.eventId);
    if (!assessment) {
      return {
        ok: false,
        reason: "unknown_event",
        message: "That event is not in the current corpus.",
      };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        reason: "missing_key",
        message: "Add LOVABLE_API_KEY in the project's Keys tab to generate model-written briefs.",
      };
    }

    // Atomically reserve the allowance before contacting the AI service.
    const { effectivePlan, BRIEF_DAILY_LIMIT } = await import("@/lib/billing/core");
    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("plan,status,expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (subError)
      return {
        ok: false,
        reason: "upstream_error",
        message: "Could not check your plan. Try again.",
      };
    const plan = effectivePlan(sub as never);
    const { data: reservation, error: claimError } = await supabaseAdmin.rpc(
      "reserve_brief_claim",
      {
        p_user_id: userId,
        p_daily_limit: BRIEF_DAILY_LIMIT[plan] ?? 0,
        p_interval_ms: MIN_BRIEF_INTERVAL_MS,
      },
    );
    if (
      claimError ||
      !reservation ||
      typeof reservation !== "object" ||
      Array.isArray(reservation)
    ) {
      return {
        ok: false,
        reason: "upstream_error",
        message: "Could not reserve a brief. Try again.",
      };
    }
    if (reservation.ok !== true) {
      return {
        ok: false,
        reason: "rate_limited",
        message:
          reservation.reason === "interval"
            ? `Try again in ${reservation.wait_seconds} seconds.`
            : `Your plan allows ${BRIEF_DAILY_LIMIT[plan]} AI briefs per day. Try again tomorrow.`,
      };
    }

    const prompt = buildPrompt(assessment);

    let response: Response;
    try {
      response = await fetch(GATEWAY_ENDPOINT, {
        method: "POST",
        signal: AbortSignal.timeout(BRIEF_TIMEOUT_MS),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1400,
          messages: [
            {
              role: "system",
              content:
                "You are a geopolitical risk analyst briefing business, investment, " +
                "supply-chain and policy teams. " +
                "You write in plain, calibrated prose. You never introduce facts that are " +
                "not present in the supplied evidence set, and you always state what would " +
                "falsify your reading.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
    } catch {
      return {
        ok: false,
        reason: "upstream_error",
        message: "Could not reach the brief service. Try again in a moment.",
      };
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error("[brief] gateway error", response.status, detail.slice(0, 500));
      if (response.status === 429) {
        return {
          ok: false,
          reason: "rate_limited",
          message: "The AI service is busy. Try again in a minute.",
        };
      }
      if (response.status === 402) {
        return {
          ok: false,
          reason: "upstream_error",
          message: "AI credits are exhausted for this workspace. Add credits, then retry.",
        };
      }
      return {
        ok: false,
        reason: "upstream_error",
        message: `The brief service returned ${response.status}. Try again in a moment.`,
      };
    }

    let payload: { choices?: { message?: { content?: string } }[] };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      return {
        ok: false,
        reason: "unparseable",
        message: "The brief service returned an unreadable response.",
      };
    }
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return {
        ok: false,
        reason: "empty_response",
        message: "The model returned an empty response.",
      };
    }

    const parsed = parseBrief(text);
    if (!parsed) {
      return {
        ok: false,
        reason: "unparseable",
        message:
          "The model did not return the expected structure. Retry, or read the evidence ledger instead.",
      };
    }

    const createdAt = Date.now();
    await supabaseAdmin.from("briefs").delete().eq("user_id", userId).eq("event_id", data.eventId);
    const { error: saveError } = await supabaseAdmin.from("briefs").insert({
      user_id: userId,
      event_id: data.eventId,
      thesis: parsed.thesis,
      channels: parsed.channels,
      caveats: parsed.caveats,
      model: MODEL,
      corpus_version: CORPUS_VERSION,
      created_at: new Date(createdAt).toISOString(),
    });
    if (saveError) console.error("[brief] save failed", saveError.message);

    return { ok: true, brief: parsed, createdAt };
  });

/* ------------------------------------------------------------------ */
/* Source connectors: poll governor + ingestion + external fetch        */
/* ------------------------------------------------------------------ */

export type RefreshResult = {
  refreshed: number;
  failed: number;
  skipped?: "in_flight" | "cooling_down";
  retryInMs?: number;
};

const skip = (reason: "in_flight" | "cooling_down", retryInMs: number): RefreshResult => ({
  refreshed: 0,
  failed: 0,
  skipped: reason,
  retryInMs,
});

const tally = (out: ConnectorOutcome[]): RefreshResult => ({
  refreshed: out.filter((r) => r.ok).length,
  failed: out.filter((r) => !r.ok).length,
});

type ClaimResult =
  { proceed: true } | { proceed: false; reason: "in_flight" | "cooling_down"; retryInMs: number };

async function claimRefresh(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  sourceId: string,
  force: boolean,
): Promise<ClaimResult> {
  const policy = POLL[sourceId];
  if (!policy) return { proceed: false, reason: "cooling_down", retryInMs: 0 };

  const { data, error } = await supabaseAdmin.rpc("claim_source_refresh", {
    p_source_id: sourceId, p_force: force, p_min_ms: policy.minIntervalMs,
    p_floor_ms: policy.forceFloorMs, p_max_run_ms: policy.maxRunMs,
  });
  if (error) throw new Error("Source refresh could not be reserved.");
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid source reservation.");
  if (data.proceed === true) return { proceed: true };
  return { proceed: false, reason: data.reason === "in_flight" ? "in_flight" : "cooling_down", retryInMs: Math.max(0, Number(data.retryInMs) || 0) };
}

const DATA_STATUSES: readonly string[] = ["observed", "stale", "unavailable"];

function countReadings(payload: string): number {
  try {
    const parsed = JSON.parse(payload);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function validateOutcome(o: ConnectorOutcome): { ok: true } | { ok: false; why: string } {
  if (!(o.sourceId in SOURCES)) return { ok: false, why: `unknown source "${o.sourceId}"` };
  if (!o.key.trim()) return { ok: false, why: "empty key" };
  if (!Number.isFinite(o.retrievedAt) || o.retrievedAt <= 0)
    return { ok: false, why: "invalid retrievedAt" };
  if (!DATA_STATUSES.includes(o.status)) return { ok: false, why: `invalid status "${o.status}"` };
  if (o.publishedAt !== undefined && (!Number.isFinite(o.publishedAt) || o.publishedAt <= 0)) {
    return { ok: false, why: "invalid publishedAt" };
  }
  if (o.problem && o.problem.length > 300) return { ok: false, why: "problem text too long" };
  if (o.note && o.note.length > 500) return { ok: false, why: "note too long" };

  if (!o.ok) {
    if (o.status !== "unavailable")
      return { ok: false, why: "a failed run must be recorded as unavailable" };
    if (o.payload !== "[]") return { ok: false, why: "a failed run must not carry a payload" };
    return { ok: true };
  }

  if (o.status !== "observed")
    return { ok: false, why: "a successful run must be recorded as observed" };
  let readings: unknown;
  try {
    readings = JSON.parse(o.payload);
  } catch {
    return { ok: false, why: "payload is not valid JSON" };
  }
  if (!Array.isArray(readings) || readings.length === 0) {
    return { ok: false, why: "a successful run must carry at least one reading" };
  }
  return { ok: true };
}

async function storeObservations(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  sourceId: string,
  items: ConnectorOutcome[],
): Promise<number> {
  const now = Date.now();
  const policy = POLL[sourceId];
  let stored = 0;
  let failures = 0;

  for (const item of items) {
    const check = validateOutcome(item);
    if (!check.ok) {
      console.warn(`[observations] rejected outcome: ${check.why}`);
      continue;
    }

    const { data: prior } = await supabaseAdmin
      .from("source_runs")
      .select("*")
      .eq("source_id", item.sourceId)
      .eq("key", item.key)
      .maybeSingle();
    const newer = !prior || item.retrievedAt >= Date.parse(prior.retrieved_at);
    if (newer) {
      const run = {
        source_id: item.sourceId,
        key: item.key,
        ok: item.ok,
        status: item.ok ? "observed" : "unavailable",
        as_of: item.ok ? item.asOf : "",
        published_at: item.ok && item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
        retrieved_at: new Date(item.retrievedAt).toISOString(),
        reading_count: item.ok ? countReadings(item.payload) : 0,
        problem: item.ok ? null : (item.problem ?? "No verified data."),
      };
      if (prior) await supabaseAdmin.from("source_runs").update(run).eq("id", prior.id);
      else await supabaseAdmin.from("source_runs").insert(run);
    }

    if (!item.ok) {
      failures += 1;
      continue;
    }

    const { data: existing } = await supabaseAdmin
      .from("observations")
      .select("id, retrieved_at")
      .eq("source_id", item.sourceId)
      .eq("key", item.key);
    for (const row of existing ?? []) {
      if (Date.parse(row.retrieved_at) <= item.retrievedAt) {
        await supabaseAdmin.from("observations").delete().eq("id", row.id);
      }
    }

    await supabaseAdmin.from("observations").insert({
      source_id: item.sourceId,
      key: item.key,
      as_of: item.asOf,
      published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
      retrieved_at: new Date(item.retrievedAt).toISOString(),
      status: "observed",
      note: item.note ?? null,
      ok: true,
      payload: item.payload,
    });
    stored += 1;
  }

  const { data: lock } = await supabaseAdmin
    .from("source_locks")
    .select("*")
    .eq("source_id", sourceId)
    .maybeSingle();
  if (lock && policy) {
    const failed = failures > 0 || stored === 0;
    const consecutiveFailures = failed ? lock.consecutive_failures + 1 : 0;
    const backoff = Math.min(
      policy.backoffBaseMs * 2 ** Math.max(0, consecutiveFailures - 1),
      policy.maxBackoffMs,
    );
    await supabaseAdmin
      .from("source_locks")
      .update({
        finished_at: new Date(now).toISOString(),
        consecutive_failures: consecutiveFailures,
        next_allowed_at: new Date(now + (failed ? backoff : policy.minIntervalMs)).toISOString(),
        failures: lock.failures + (failed ? 1 : 0),
      })
      .eq("id", lock.id);
  }

  return stored;
}

/* ---- transport ---- */

const TIMEOUT_MS = 20_000;
const UA = "GlobalMatrix/1.0 (open-source intelligence dashboard)";
const PROBLEMS = {
  timeout: "The source did not respond in time.",
  network: "The source could not be reached.",
  http: "The source returned an error.",
  throttled: "The source is rate-limiting requests. Try again shortly.",
  shape: "The source returned data in an unexpected shape.",
  empty: "The source returned no readings for this request.",
} as const;

async function getJson(
  url: string,
): Promise<{ ok: true; data: unknown } | { ok: false; problem: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": UA },
    });
    if (!res.ok)
      return {
        ok: false,
        problem: res.status === 429 ? PROBLEMS.throttled : PROBLEMS.http,
        status: res.status,
      };
    return { ok: true, data: await res.json() };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, problem: aborted ? PROBLEMS.timeout : PROBLEMS.network, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

function usableNumber(v: unknown, opts: { positive?: boolean } = {}): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  if (opts.positive && n <= 0) return null;
  return n;
}

const fail = (sourceId: string, key: string, problem: string): ConnectorOutcome => ({
  sourceId,
  key,
  asOf: "",
  retrievedAt: Date.now(),
  status: "unavailable",
  ok: false,
  problem,
  payload: "[]",
});

const ISO3: Record<string, string> = {
  CN: "CHN",
  US: "USA",
  RU: "RUS",
  IR: "IRN",
  TW: "TWN",
  KR: "KOR",
  JP: "JPN",
  NL: "NLD",
  GB: "GBR",
  DE: "DEU",
  IN: "IND",
  TR: "TUR",
  AE: "ARE",
  SA: "SAU",
  SG: "SGP",
  BR: "BRA",
  ZA: "ZAF",
  MY: "MYS",
};
const ECONOMIES = Object.entries(ISO3).map(([node, iso3]) => ({ node, iso3 }));

const WB_SERIES = [
  { id: "NY.GDP.MKTP.KD.ZG", label: "Real GDP growth", unit: "%", key: "gdpGrowth" },
  { id: "NY.GDP.MKTP.CD", label: "GDP", unit: "US$", key: "gdp" },
  { id: "FP.CPI.TOTL.ZG", label: "Inflation", unit: "%", key: "inflation" },
  { id: "NE.TRD.GNFS.ZS", label: "Trade share of GDP", unit: "%", key: "tradeOpen" },
  { id: "SP.POP.TOTL", label: "Population", unit: "people", key: "population" },
] as const;

async function pullWorldBank(series: (typeof WB_SERIES)[number]): Promise<ConnectorOutcome> {
  const countries = ECONOMIES.map((e) => e.iso3).join(";");
  const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${series.id}?format=json&date=2018:2025&per_page=1000`;
  const res = await getJson(url);
  if (!res.ok) return fail("worldbank", series.key, res.problem);
  if (!Array.isArray(res.data) || !Array.isArray(res.data[1]))
    return fail("worldbank", series.key, PROBLEMS.shape);

  const meta = res.data[0] as { lastupdated?: string } | undefined;
  const rows = res.data[1] as unknown[];
  const isoToNode = new Map(ECONOMIES.map((e) => [e.iso3, e.node]));
  const retrievedAt = Date.now();
  const readings: Record<string, unknown>[] = [];
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as {
      countryiso3code?: unknown;
      date?: unknown;
      value?: unknown;
      country?: { id?: unknown };
    };
    const iso3 = typeof r.countryiso3code === "string" ? r.countryiso3code : null;
    const year = typeof r.date === "string" ? r.date : null;
    if (!iso3 || !year) continue;
    const node = isoToNode.get(iso3) ?? (typeof r.country?.id === "string" ? r.country.id : null);
    if (!node) continue;
    const value = usableNumber(r.value, {
      positive: series.key === "gdp" || series.key === "population",
    });
    if (value === null) continue;
    readings.push({
      key: `${node}:${series.key}:${year}`,
      node,
      indicatorKey: series.key,
      seriesId: series.id,
      label: series.label,
      value,
      unit: series.unit,
      period: year,
      provenance: {
        sourceId: "worldbank",
        asOf: meta?.lastupdated ?? "",
        retrievedAt,
        status: "observed",
      },
    });
  }
  if (readings.length === 0) return fail("worldbank", series.key, PROBLEMS.empty);
  const deduped = new Map<string, Record<string, unknown>>();
  for (const r of readings) if (!deduped.has(r.key as string)) deduped.set(r.key as string, r);
  return {
    sourceId: "worldbank",
    key: series.key,
    asOf: meta?.lastupdated ?? "",
    retrievedAt,
    status: "observed",
    ok: true,
    payload: JSON.stringify([...deduped.values()]),
  };
}

const COMTRADE_REPORTERS: Record<string, number> = {
  CN: 156,
  US: 842,
  DE: 276,
  JP: 392,
  GB: 826,
  NL: 528,
  IN: 699,
  KR: 410,
  SG: 702,
  BR: 223,
};

async function pullComtrade(period: string): Promise<ConnectorOutcome> {
  const reporterCodes = Object.values(COMTRADE_REPORTERS);
  const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporterCodes.join(",")}&period=${period}&flowCode=M,X&partnerCode=0&cmdCode=TOTAL`;
  const res = await getJson(url);
  if (!res.ok) return fail("comtrade", `comtrade:${period}`, res.problem);
  if (typeof res.data !== "object" || res.data === null)
    return fail("comtrade", `comtrade:${period}`, PROBLEMS.shape);
  const rows = (res.data as { data?: unknown }).data;
  if (!Array.isArray(rows)) return fail("comtrade", `comtrade:${period}`, PROBLEMS.shape);

  const codeToNode = new Map(
    Object.entries(COMTRADE_REPORTERS).map(([node, code]) => [code, node]),
  );
  const retrievedAt = Date.now();
  const totals = new Map<string, { exports: number; imports: number }>();
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as { reporterCode?: unknown; flowCode?: unknown; primaryValue?: unknown };
    const reporter = codeToNode.get(Number(r.reporterCode));
    if (!reporter) continue;
    const value = usableNumber(r.primaryValue, { positive: true });
    if (value === null) continue;
    const slot = totals.get(reporter) ?? { exports: 0, imports: 0 };
    if (r.flowCode === "X") slot.exports += value;
    else if (r.flowCode === "M") slot.imports += value;
    totals.set(reporter, slot);
  }
  if (totals.size === 0) return fail("comtrade", `comtrade:${period}`, PROBLEMS.empty);
  const flows = [...totals.entries()].map(([reporter, t]) => ({
    key: `${reporter}:${period}`,
    reporter,
    reporterIso: ISO3[reporter] ?? "",
    partner: "World",
    partnerIso: null,
    period,
    exportsUsd: Math.round(t.exports),
    importsUsd: Math.round(t.imports),
    provenance: {
      sourceId: "comtrade",
      asOf: period,
      retrievedAt,
      status: "observed",
      note: "Public preview tier: sampled, abbreviated detail.",
    },
  }));
  return {
    sourceId: "comtrade",
    key: `comtrade:${period}`,
    asOf: period,
    retrievedAt,
    status: "observed",
    ok: true,
    payload: JSON.stringify(flows),
  };
}

function gdeltStamp(raw: string): number | undefined {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(raw.trim());
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m;
  const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  return Number.isFinite(ms) && ms > 0 ? ms : undefined;
}

const GDELT_MIN_INTERVAL_MS = 8_000;
const GDELT_RETRIES = 2;
let gdeltLastCall = 0;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gdeltGet(
  path: string,
): Promise<{ ok: true; data: unknown } | { ok: false; problem: string }> {
  for (let attempt = 0; attempt <= GDELT_RETRIES; attempt++) {
    const since = GDELT_MIN_INTERVAL_MS - (Date.now() - gdeltLastCall);
    if (since > 0) await wait(since);
    gdeltLastCall = Date.now();
    const res = await getJson(`https://api.gdeltproject.org/api/v2/${path}`);
    if (res.ok) return { ok: true, data: res.data };
    if (res.status === 429 && attempt < GDELT_RETRIES) {
      await wait(GDELT_MIN_INTERVAL_MS * (attempt + 1));
      continue;
    }
    return { ok: false, problem: res.problem };
  }
  return { ok: false, problem: PROBLEMS.throttled };
}

async function pullGdeltAttention(topic: string): Promise<ConnectorOutcome> {
  const query = encodeURIComponent(topic);
  const res = await gdeltGet(`doc/doc?query=${query}&mode=timelinevolinfo&format=json&timespan=7d`);
  if (!res.ok) return fail("gdelt", `attention:${topic}`, res.problem);
  if (typeof res.data !== "object" || res.data === null)
    return fail("gdelt", `attention:${topic}`, PROBLEMS.shape);
  const timeline = (res.data as { timeline?: unknown }).timeline;
  if (!Array.isArray(timeline)) return fail("gdelt", `attention:${topic}`, PROBLEMS.shape);

  const retrievedAt = Date.now();
  const points: Record<string, unknown>[] = [];
  for (const entry of timeline) {
    if (typeof entry !== "object" || entry === null) continue;
    const series = (entry as { series?: string }).series ?? "";
    const data = (entry as { data?: unknown }).data;
    if (!Array.isArray(data)) continue;
    for (const bucket of data) {
      if (typeof bucket !== "object" || bucket === null) continue;
      const b = bucket as { date?: unknown; value?: unknown };
      if (typeof b.date !== "string") continue;
      const value = usableNumber(b.value);
      if (value === null) continue;
      points.push({
        key: `${topic}:${b.date}:${series}`,
        at: b.date,
        attention: value,
        tone: null,
        provenance: {
          sourceId: "gdelt",
          asOf: b.date,
          retrievedAt,
          status: "observed",
          note: "Media attention volume. Not evidence that an event occurred.",
        },
      });
    }
  }
  if (points.length === 0) return fail("gdelt", `attention:${topic}`, PROBLEMS.empty);
  return {
    sourceId: "gdelt",
    key: `attention:${topic}`,
    asOf: (points[points.length - 1] as { at: string }).at,
    retrievedAt,
    status: "observed",
    ok: true,
    payload: JSON.stringify(points),
  };
}

async function pullGdeltHeadlines(topic: string): Promise<ConnectorOutcome> {
  const query = encodeURIComponent(topic);
  const res = await gdeltGet(
    `doc/doc?query=${query}&mode=artlist&format=json&maxrecords=25&sort=datedesc&timespan=7d`,
  );
  if (!res.ok) return fail("gdelt", `headlines:${topic}`, res.problem);
  if (typeof res.data !== "object" || res.data === null)
    return fail("gdelt", `headlines:${topic}`, PROBLEMS.shape);
  const articles = (res.data as { articles?: unknown }).articles;
  if (!Array.isArray(articles)) return fail("gdelt", `headlines:${topic}`, PROBLEMS.shape);

  const retrievedAt = Date.now();
  const seen = new Set<string>();
  const items: {
    key: string;
    title: string;
    url: string;
    domain: string;
    seenAt: string;
    provenance: unknown;
  }[] = [];
  for (const a of articles) {
    if (typeof a !== "object" || a === null) continue;
    const r = a as { url?: unknown; title?: unknown; domain?: unknown; seendate?: unknown };
    const url = typeof r.url === "string" ? r.url : null;
    const title = typeof r.title === "string" ? r.title : null;
    if (!url || !title) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const at = typeof r.seendate === "string" ? r.seendate : "";
    items.push({
      key: url,
      title: title.slice(0, 300),
      url,
      domain: typeof r.domain === "string" ? r.domain : "",
      seenAt: at,
      provenance: { sourceId: "gdelt", asOf: at, retrievedAt, status: "observed" },
    });
  }
  if (items.length === 0) return fail("gdelt", `headlines:${topic}`, PROBLEMS.empty);
  let publishedAt: number | undefined;
  for (const item of items) {
    const stamp = gdeltStamp(item.seenAt);
    if (stamp !== undefined && (publishedAt === undefined || stamp > publishedAt))
      publishedAt = stamp;
  }
  return {
    sourceId: "gdelt",
    key: `headlines:${topic}`,
    asOf: items[0].seenAt,
    publishedAt,
    retrievedAt,
    status: "observed",
    ok: true,
    payload: JSON.stringify(items),
  };
}

const ATTENTION_TOPICS = ["trade war", "sanctions"];

/* ---- ECB (SDMX, text transport) ---- */

async function getText(
  url: string,
): Promise<{ ok: true; data: string } | { ok: false; problem: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "text/csv, text/plain", "user-agent": UA },
    });
    if (!res.ok)
      return { ok: false, problem: res.status === 429 ? PROBLEMS.throttled : PROBLEMS.http };
    return { ok: true, data: await res.text() };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, problem: aborted ? PROBLEMS.timeout : PROBLEMS.network };
  } finally {
    clearTimeout(timer);
  }
}

const ECB_BASE = "https://data-api.ecb.europa.eu/service/data";

async function pullEcbFx(): Promise<ConnectorOutcome> {
  const codes = ECB_FX.map((c) => c.code);
  const url = `${ECB_BASE}/EXR/D.${codes.join("+")}.EUR.SP00.A?format=csvdata&detail=dataonly&lastNObservations=1`;
  const res = await getText(url);
  if (!res.ok)
    return {
      sourceId: "ecb",
      key: "fx",
      asOf: "",
      retrievedAt: Date.now(),
      status: "unavailable",
      ok: false,
      problem: res.problem,
      payload: "[]",
    };

  const rows = readSdmx(res.data);
  if (rows.length === 0)
    return {
      sourceId: "ecb",
      key: "fx",
      asOf: "",
      retrievedAt: Date.now(),
      status: "unavailable",
      ok: false,
      problem: "The source returned a table we could not read.",
      payload: "[]",
    };

  const retrievedAt = Date.now();
  const labelOf = new Map(ECB_FX.map((c) => [c.code, c.label]));
  const points: Record<string, unknown>[] = [];
  let asOf = "";
  for (const row of rows) {
    const match = /^EXR\.D\.([A-Z]{3})\.EUR\.SP00\.A$/.exec(row.series);
    if (!match) continue;
    const series = match[1];
    if (!labelOf.has(series)) continue;
    if (row.date > asOf) asOf = row.date;
    points.push({
      key: `fx:${series}:${row.date}`,
      series,
      label: `${labelOf.get(series)} per euro`,
      date: row.date,
      value: row.value,
      provenance: {
        sourceId: "ecb",
        asOf: row.date,
        retrievedAt,
        status: "observed",
        note: "ECB reference rate, fixed 14:15 CET. Not an executable quote.",
      },
    });
  }
  if (points.length === 0)
    return {
      sourceId: "ecb",
      key: "fx",
      asOf: "",
      retrievedAt,
      status: "unavailable",
      ok: false,
      problem: "The source returned no readings for this request.",
      payload: "[]",
    };
  return {
    sourceId: "ecb",
    key: "fx",
    asOf,
    retrievedAt,
    status: "observed",
    ok: true,
    payload: JSON.stringify(points),
  };
}

async function pullEcbYield(): Promise<ConnectorOutcome[]> {
  const out: ConnectorOutcome[] = [];
  for (const tenor of ECB_TENORS) {
    const url = `${ECB_BASE}/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.${tenor.code}?format=csvdata&detail=dataonly&lastNObservations=1`;
    const res = await getText(url);
    if (!res.ok) {
      out.push({
        sourceId: "ecb",
        key: `yield:${tenor.code}`,
        asOf: "",
        retrievedAt: Date.now(),
        status: "unavailable",
        ok: false,
        problem: res.problem,
        payload: "[]",
      });
      continue;
    }
    const rows = readSdmx(res.data);
    if (rows.length === 0) {
      out.push({
        sourceId: "ecb",
        key: `yield:${tenor.code}`,
        asOf: "",
        retrievedAt: Date.now(),
        status: "unavailable",
        ok: false,
        problem: "The source returned a table we could not read.",
        payload: "[]",
      });
      continue;
    }
    const retrievedAt = Date.now();
    const row = rows[rows.length - 1];
    out.push({
      sourceId: "ecb",
      key: `yield:${tenor.code}`,
      asOf: row.date,
      retrievedAt,
      status: "observed",
      ok: true,
      payload: JSON.stringify([
        {
          key: `yield:${tenor.code}:${row.date}`,
          tenor: tenor.code,
          label: tenor.label,
          date: row.date,
          value: row.value,
          provenance: { sourceId: "ecb", asOf: row.date, retrievedAt, status: "observed" },
        },
      ]),
    });
  }
  return out;
}

async function latestComtradeYear(): Promise<string> {
  return String(new Date().getUTCFullYear() - 1);
}

/* ---- the four refresh server functions ---- */

export const refreshMacro = createServerFn({ method: "POST" })
  .validator((d?: { force?: boolean }) => validateRefreshInput(d))
  .handler(async ({ data }): Promise<RefreshResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claim = await claimRefresh(supabaseAdmin, "worldbank", !!data.force);
    if (!claim.proceed) return skip(claim.reason, claim.retryInMs);
    const out: ConnectorOutcome[] = [];
    for (const series of WB_SERIES) out.push(await pullWorldBank(series));
    await storeObservations(supabaseAdmin, "worldbank", out);
    return tally(out);
  });

export const refreshTrade = createServerFn({ method: "POST" })
  .validator((d?: { force?: boolean }) => validateRefreshInput(d))
  .handler(async ({ data }): Promise<RefreshResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claim = await claimRefresh(supabaseAdmin, "comtrade", !!data.force);
    if (!claim.proceed) return skip(claim.reason, claim.retryInMs);
    const out = [await pullComtrade(await latestComtradeYear())];
    await storeObservations(supabaseAdmin, "comtrade", out);
    return tally(out);
  });

export const refreshAttention = createServerFn({ method: "POST" })
  .validator((d?: { force?: boolean }) => validateRefreshInput(d))
  .handler(async ({ data }): Promise<RefreshResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claim = await claimRefresh(supabaseAdmin, "gdelt", !!data.force);
    if (!claim.proceed) return skip(claim.reason, claim.retryInMs);
    const out: ConnectorOutcome[] = [];
    for (const topic of ATTENTION_TOPICS) out.push(await pullGdeltHeadlines(topic));
    for (const topic of ATTENTION_TOPICS) out.push(await pullGdeltAttention(topic));
    await storeObservations(supabaseAdmin, "gdelt", out);
    return tally(out);
  });

export const refreshEcb = createServerFn({ method: "POST" })
  .validator((d?: { force?: boolean }) => validateRefreshInput(d))
  .handler(async ({ data }): Promise<RefreshResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claim = await claimRefresh(supabaseAdmin, "ecb", !!data.force);
    if (!claim.proceed) return skip(claim.reason, claim.retryInMs);
    const out = [await pullEcbFx(), ...(await pullEcbYield())];
    await storeObservations(supabaseAdmin, "ecb", out);
    return tally(out);
  });

export type { DataStatus };
