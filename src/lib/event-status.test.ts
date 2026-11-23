import { describe, expect, it } from "vitest";
import { scenarioEventStatus } from "./event-status";

const NOW = Date.parse("2026-11-23T15:00:00Z");

describe("scenario events are never LIVE", () => {
  it("a demo event detected today is SCENARIO, not LIVE", () => {
    expect(scenarioEventStatus("2026-11-23T10:00:00Z", NOW).label).toBe("SCENARIO");
  });
  it("an October demo event is SCENARIO and says how old it is", () => {
    const s = scenarioEventStatus("2026-10-02T00:00:00Z", NOW);
    expect(s.label).toBe("SCENARIO");
    expect(s.help).toContain("2026-10-02");
  });
  it("a missing date is UNAVAILABLE", () => {
    expect(scenarioEventStatus("", NOW).label).toBe("UNAVAILABLE");
  });
});
