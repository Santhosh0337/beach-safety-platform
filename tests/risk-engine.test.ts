
import { describe, expect, it } from 'vitest';
import { assessBeachRisk } from '../server/risk/engine';

const base = {
  beachId: 'rushikonda',
  evidenceStatus: 'available' as const,
  waveHeightM: 0.8,
  modelAgeSeconds: 600,
};

describe('assessBeachRisk', () => {
  it('returns a provisional result for valid fresh evidence', () => {
    const result = assessBeachRisk(base);

    expect(result.level).toBe('green');
    expect(result.assessmentStatus).toBe('provisional');
    expect(result.provenance).toBe('live-model');
    expect(result.score).not.toBeNull();
  });

  it('uses higher prototype levels for higher wave heights', () => {
    expect(assessBeachRisk({ ...base, waveHeightM: 1.2 }).level)
      .toBe('yellow');
    expect(assessBeachRisk({ ...base, waveHeightM: 1.8 }).level)
      .toBe('orange');
    expect(assessBeachRisk({ ...base, waveHeightM: 2.5 }).level)
      .toBe('red');
  });

  it('does not produce green when evidence is stale', () => {
    const result = assessBeachRisk({
      ...base,
      evidenceStatus: 'stale',
    });

    expect(result.level).toBe('gray');
    expect(result.score).toBeNull();
    expect(result.assessmentStatus).toBe('insufficient-evidence');
  });

  it('does not produce green when evidence is unavailable', () => {
    const result = assessBeachRisk({
      ...base,
      evidenceStatus: 'unavailable',
    });

    expect(result.level).toBe('gray');
    expect(result.score).toBeNull();
  });

  it('rejects missing, invalid and negative wave heights', () => {
    for (const waveHeightM of [null, Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      const result = assessBeachRisk({ ...base, waveHeightM });

      expect(result.level).toBe('gray');
      expect(result.assessmentStatus).toBe('insufficient-evidence');
    }
  });

  it('rejects missing, invalid, negative and overly old model ages', () => {
    for (const modelAgeSeconds of [
      null,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      -1,
      10_801,
    ]) {
      const result = assessBeachRisk({ ...base, modelAgeSeconds });

      expect(result.level).toBe('gray');
      expect(result.score).toBeNull();
    }
  });

  it('gives a confirmed official closure precedence over the score', () => {
    const result = assessBeachRisk({
      ...base,
      officialClosureConfirmed: true,
    });

    expect(result.level).toBe('red');
    expect(result.assessmentStatus).toBe('override');
    expect(result.provenance).toBe('authority-entered');
  });

  it('gives a confirmed critical hazard precedence over the score', () => {
    const result = assessBeachRisk({
      ...base,
      criticalHazardConfirmed: true,
    });

    expect(result.level).toBe('red');
    expect(result.assessmentStatus).toBe('override');
  });

  it('includes an explanatory reason and safety disclaimer', () => {
    const result = assessBeachRisk(base);

    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('Not an official');
  });
});
