import { describe, expect, it } from 'vitest';
import { applyStreak, toLocalDateISO } from './streak';

const base = { current: 0, longest: 0, lastCompletedDateISO: null as string | null };

describe('applyStreak', () => {
  it('prvo ikad dovršenje postavlja streak na 1', () => {
    const result = applyStreak(base, new Date('2026-01-10T12:00:00'));
    expect(result).toEqual({ current: 1, longest: 1, lastCompletedDateISO: '2026-01-10' });
  });

  it('isti dan je no-op', () => {
    const streak = { current: 3, longest: 5, lastCompletedDateISO: '2026-01-10' };
    const result = applyStreak(streak, new Date('2026-01-10T23:59:00'));
    expect(result).toBe(streak);
  });

  it('točno +1 dan povećava streak i prati longest', () => {
    const streak = { current: 3, longest: 3, lastCompletedDateISO: '2026-01-10' };
    const result = applyStreak(streak, new Date('2026-01-11T08:00:00'));
    expect(result).toEqual({ current: 4, longest: 4, lastCompletedDateISO: '2026-01-11' });
  });

  it('longest ostaje ako je već veći od novog current', () => {
    const streak = { current: 2, longest: 10, lastCompletedDateISO: '2026-01-10' };
    const result = applyStreak(streak, new Date('2026-01-11T08:00:00'));
    expect(result).toEqual({ current: 3, longest: 10, lastCompletedDateISO: '2026-01-11' });
  });

  it('razmak veći od jednog dana resetira streak na 1', () => {
    const streak = { current: 7, longest: 7, lastCompletedDateISO: '2026-01-10' };
    const result = applyStreak(streak, new Date('2026-01-15T08:00:00'));
    expect(result).toEqual({ current: 1, longest: 7, lastCompletedDateISO: '2026-01-15' });
  });
});

describe('toLocalDateISO', () => {
  it('formatira datum kao YYYY-MM-DD', () => {
    expect(toLocalDateISO(new Date('2026-03-05T10:00:00'))).toBe('2026-03-05');
  });
});
