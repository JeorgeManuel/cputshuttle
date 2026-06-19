export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateReliabilityScore(input: {
  reporterCount: number;
  freshnessSeconds: number;
  agreementMeters: number;
  avgAccuracyMeters: number;
}): number {
  const reporterFactor = clamp(Math.log2(input.reporterCount + 1) / 2);
  const freshnessFactor = clamp(1 - input.freshnessSeconds / 60);
  const agreementFactor = clamp(1 - input.agreementMeters / 120);
  const accuracyFactor = clamp(1 - input.avgAccuracyMeters / 100);

  return clamp(
    0.4 * reporterFactor +
      0.25 * freshnessFactor +
      0.2 * agreementFactor +
      0.15 * accuracyFactor
  );
}

export function reliabilityLabel(score: number): "low" | "medium" | "high" {
  if (score < 0.4) return "low";
  if (score < 0.75) return "medium";
  return "high";
}
