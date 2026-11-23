import { describe, expect, it } from "vitest";
import { isInWindow } from "./time-window";

const NOW = Date.parse("2026-11-23T15:38:00Z");

describe("time windows use the real clock", () => {
  it("an October event is not inside a 23 Nov 24H window", () => {
    expect(isInWindow("2026-10-02T09:00:00Z", "24h", NOW)).toBe(false);
  });
  it("an event 23 hours old is inside 24H but not 6H", () => {
    expect(isInWindow("2026-11-22T16:38:00Z", "24h", NOW)).toBe(true);
    expect(isInWindow("2026-11-22T16:38:00Z", "6h", NOW)).toBe(false);
  });
  it("exactly 24 hours old is outside 24H", () => {
    expect(isInWindow("2026-11-22T15:38:00Z", "24h", NOW)).toBe(false);
  });
  it("30 minutes old is inside 1H; 6 days old is inside 7D", () => {
    expect(isInWindow("2026-11-23T15:08:00Z", "1h", NOW)).toBe(true);
    expect(isInWindow("2026-11-17T15:38:01Z", "7d", NOW)).toBe(true);
  });
  it("missing, invalid and future timestamps are excluded", () => {
    expect(isInWindow(undefined, "7d", NOW)).toBe(false);
    expect(isInWindow("not a date", "7d", NOW)).toBe(false);
    expect(isInWindow("2026-11-24T00:00:00Z", "7d", NOW)).toBe(false);
  });
});
