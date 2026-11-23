import { describe, expect, it } from "vitest";
import { rankByWeightedExposure } from "./canonical-exposure";

describe("rankByWeightedExposure", () => {
  it("ranks by weighted overall score, not raw load", () => {
    const rows = [
      { nodeId: "eu", label: "European Union", overall: 0.38 },
      { nodeId: "in", label: "India", overall: 1 },
      { nodeId: "cn", label: "China", overall: 0.55 },
    ];
    expect(rankByWeightedExposure(rows).map((r) => r.nodeId)).toEqual(["in", "cn", "eu"]);
  });
  it("drops rows without a numeric score instead of inventing one", () => {
    expect(rankByWeightedExposure([{ nodeId: "x", label: "X", overall: Number.NaN }])).toEqual([]);
  });
});
