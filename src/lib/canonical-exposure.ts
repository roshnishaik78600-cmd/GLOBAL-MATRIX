/**
 * The one ranking any page uses to name "the most exposed" economy: the
 * weighted overall score from the signal matrix, which the World map also reads.
 */
export type WeightedRow = { nodeId: string; label: string; short?: string; overall: number };

export function rankByWeightedExposure<T extends WeightedRow>(rows: readonly T[] | undefined): T[] {
  return [...(rows ?? [])]
    .filter((r) => Number.isFinite(r.overall))
    .sort((a, b) => b.overall - a.overall);
}
