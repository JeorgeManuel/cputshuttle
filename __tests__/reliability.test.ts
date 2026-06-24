import { clamp, calculateReliabilityScore, reliabilityLabel } from "@/lib/reliability";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(0.5)).toBe(0.5);
  });

  it("clamps value below min to min", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(-0.5, 0, 1)).toBe(0);
  });

  it("clamps value above max to max", () => {
    expect(clamp(1.5)).toBe(1);
    expect(clamp(2, 0, 1)).toBe(1);
  });

  it("uses custom min and max", () => {
    expect(clamp(5, 2, 10)).toBe(5);
    expect(clamp(1, 2, 10)).toBe(2);
    expect(clamp(15, 2, 10)).toBe(10);
  });

  it("handles edge values exactly at boundaries", () => {
    expect(clamp(0)).toBe(0);
    expect(clamp(1)).toBe(1);
  });
});

describe("calculateReliabilityScore", () => {
  it("returns 0 for worst-case inputs", () => {
    const score = calculateReliabilityScore({
      reporterCount: 0,
      freshnessSeconds: 120,
      agreementMeters: 200,
      avgAccuracyMeters: 200
    });
    expect(score).toBe(0);
  });

  it("returns high score for ideal inputs", () => {
    const score = calculateReliabilityScore({
      reporterCount: 7,
      freshnessSeconds: 0,
      agreementMeters: 0,
      avgAccuracyMeters: 0
    });
    expect(score).toBeGreaterThan(0.9);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("returns moderate score for average inputs", () => {
    const score = calculateReliabilityScore({
      reporterCount: 3,
      freshnessSeconds: 30,
      agreementMeters: 60,
      avgAccuracyMeters: 50
    });
    expect(score).toBeGreaterThan(0.3);
    expect(score).toBeLessThan(0.8);
  });

  it("is between 0 and 1", () => {
    const score = calculateReliabilityScore({
      reporterCount: 2,
      freshnessSeconds: 45,
      agreementMeters: 80,
      avgAccuracyMeters: 60
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("increases with more reporters", () => {
    const base = { freshnessSeconds: 10, agreementMeters: 20, avgAccuracyMeters: 30 };
    const score1 = calculateReliabilityScore({ ...base, reporterCount: 1 });
    const score3 = calculateReliabilityScore({ ...base, reporterCount: 3 });
    expect(score3).toBeGreaterThan(score1);
  });

  it("decreases with higher freshness (staleness)", () => {
    const base = { reporterCount: 3, agreementMeters: 20, avgAccuracyMeters: 30 };
    const scoreFresh = calculateReliabilityScore({ ...base, freshnessSeconds: 5 });
    const scoreStale = calculateReliabilityScore({ ...base, freshnessSeconds: 50 });
    expect(scoreFresh).toBeGreaterThan(scoreStale);
  });

  it("decreases with worse agreement", () => {
    const base = { reporterCount: 3, freshnessSeconds: 10, avgAccuracyMeters: 30 };
    const scoreGood = calculateReliabilityScore({ ...base, agreementMeters: 10 });
    const scoreBad = calculateReliabilityScore({ ...base, agreementMeters: 100 });
    expect(scoreGood).toBeGreaterThan(scoreBad);
  });
});

describe("reliabilityLabel", () => {
  it("returns 'low' for score below 0.4", () => {
    expect(reliabilityLabel(0)).toBe("low");
    expect(reliabilityLabel(0.2)).toBe("low");
    expect(reliabilityLabel(0.39)).toBe("low");
  });

  it("returns 'medium' for score between 0.4 and 0.75", () => {
    expect(reliabilityLabel(0.4)).toBe("medium");
    expect(reliabilityLabel(0.5)).toBe("medium");
    expect(reliabilityLabel(0.74)).toBe("medium");
  });

  it("returns 'high' for score 0.75 and above", () => {
    expect(reliabilityLabel(0.75)).toBe("high");
    expect(reliabilityLabel(0.9)).toBe("high");
    expect(reliabilityLabel(1)).toBe("high");
  });
});
