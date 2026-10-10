import { describe, expect, it } from "vitest";
import { parseBrief, validateBriefInput, validateRefreshInput } from "@/lib/backend/server";

describe("brief rules", () => {
  it("rejects malformed event ids", () => {
    expect(() => validateBriefInput({ eventId: "" })).toThrow();
    expect(() => validateBriefInput({ eventId: "x".repeat(101) })).toThrow();
    expect(() => validateBriefInput({ eventId: "a; drop table" })).toThrow();
    expect(validateBriefInput({ eventId: "hormuz-2026" })).toEqual({ eventId: "hormuz-2026" });
  });

  it("only forces a refresh when force is literally true", () => {
    expect(validateRefreshInput({ force: "yes" })).toEqual({ force: false });
    expect(validateRefreshInput(undefined)).toEqual({ force: false });
    expect(validateRefreshInput({ force: true })).toEqual({ force: true });
  });

  it("caps channels at 4 and caveats at 5", () => {
    const b = parseBrief(
      JSON.stringify({ thesis: "T", channels: Array(9).fill("c"), caveats: Array(9).fill("v") }),
    );
    expect(b?.channels).toHaveLength(4);
    expect(b?.caveats).toHaveLength(5);
  });

  it("returns null when the thesis is missing", () => {
    expect(parseBrief('{"channels":[]}')).toBeNull();
    expect(parseBrief("not json")).toBeNull();
  });
});
