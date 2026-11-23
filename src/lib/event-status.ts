/**
 * Status tag for an event from the demonstration corpus. These events are
 * synthetic, so they are never LIVE: they are always labelled SCENARIO, with
 * their detection date measured against the real clock.
 */
export function scenarioEventStatus(
  detectedAt: string | null | undefined,
  now: number,
): { label: "SCENARIO" | "UNAVAILABLE"; help: string } {
  const ms = detectedAt ? Date.parse(detectedAt) : Number.NaN;
  if (!detectedAt || Number.isNaN(ms)) {
    return { label: "UNAVAILABLE", help: "No valid detection date is recorded for this event." };
  }
  const days = Math.max(0, Math.round((now - ms) / 86_400_000));
  return {
    label: "SCENARIO",
    help: `Demonstration event dated ${detectedAt.slice(0, 10)} (${days} days ago). Not live news and not a verified observation.`,
  };
}
