import { describe, expect, it } from 'vitest';
import {
  SCORE_STRIKE_BASE_POINTS,
  SCORE_STRIKE_COMBO_CAP,
  SCORE_STRIKE_MAX_SPEED_BONUS,
  comboMultiplier,
  scoreAnswer,
  speedBonus,
} from './scoring';

describe('comboMultiplier', () => {
  it('je 1x bez comba', () => {
    expect(comboMultiplier(0)).toBe(1);
  });

  it('raste 10% po uzastopnom točnom odgovoru', () => {
    expect(comboMultiplier(3)).toBeCloseTo(1.3);
  });

  it('se kapira na SCORE_STRIKE_COMBO_CAP', () => {
    expect(comboMultiplier(SCORE_STRIKE_COMBO_CAP)).toBeCloseTo(comboMultiplier(SCORE_STRIKE_COMBO_CAP + 10));
  });
});

describe('speedBonus', () => {
  it('daje puni bonus kad je odgovoreno odmah (svo vrijeme preostalo)', () => {
    expect(speedBonus(10_000, 10_000)).toBe(SCORE_STRIKE_MAX_SPEED_BONUS);
  });

  it('daje 0 bonusa kad nema preostalog vremena', () => {
    expect(speedBonus(0, 10_000)).toBe(0);
  });

  it('linearno skalira između granica', () => {
    expect(speedBonus(5_000, 10_000)).toBe(Math.round(SCORE_STRIKE_MAX_SPEED_BONUS / 2));
  });
});

describe('scoreAnswer', () => {
  it('krivi odgovor daje 0 bodova i resetira combo', () => {
    const result = scoreAnswer({ correct: false, remainingMs: 8000, totalMs: 10_000, comboBeforeAnswer: 5 });
    expect(result.pointsAwarded).toBe(0);
    expect(result.newCombo).toBe(0);
  });

  it('točan odgovor bez comba i bez preostalog vremena daje samo baznu vrijednost', () => {
    const result = scoreAnswer({ correct: true, remainingMs: 0, totalMs: 10_000, comboBeforeAnswer: 0 });
    expect(result.pointsAwarded).toBe(SCORE_STRIKE_BASE_POINTS);
    expect(result.newCombo).toBe(1);
  });

  it('točan odgovor s punim bonusom i combom kombinira sve faktore', () => {
    const result = scoreAnswer({ correct: true, remainingMs: 10_000, totalMs: 10_000, comboBeforeAnswer: 2 });
    const expectedPoints = Math.round((SCORE_STRIKE_BASE_POINTS + SCORE_STRIKE_MAX_SPEED_BONUS) * comboMultiplier(2));
    expect(result.pointsAwarded).toBe(expectedPoints);
    expect(result.newCombo).toBe(3);
  });
});
