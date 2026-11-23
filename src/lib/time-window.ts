/** Wall-clock time windows. Historical events must never count as current. */
export type TimeWindowId = "1h" | "6h" | "24h" | "7d";

export const WINDOW_MS: Record<TimeWindowId, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

/**
 * True when `timestamp` (ISO, UTC) falls in (now − window, now]. Missing,
 * invalid or future-dated timestamps are excluded.
 */
export function isInWindow(timestamp: string | null | undefined, window: TimeWindowId, now: number): boolean {
  if (!timestamp) return false;
  const ms = Date.parse(timestamp);
  if (Number.isNaN(ms)) return false;
  return ms <= now && ms > now - WINDOW_MS[window];
}

/** "2026-11-22 15:38 → 2026-11-23 15:38 UTC" */
export function windowRangeLabel(window: TimeWindowId, now: number): string {
  const f = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace("T", " ");
  return `${f(now - WINDOW_MS[window])} → ${f(now)} UTC`;
}
