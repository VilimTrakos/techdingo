import { describe, expect, it } from 'vitest';
import {
  HEART_REGEN_INTERVAL_MS,
  grantHearts,
  msUntilNextHeart,
  resolveHearts,
  spendHeart,
} from './hearts';
import { MAX_HEARTS } from './progressTypes';

const T0 = new Date('2026-08-22T10:00:00Z');
const hours = (n: number) => new Date(T0.getTime() + n * 60 * 60 * 1000);

describe('spendHeart', () => {
  it('smanjuje zalihu i pokreće regen sat', () => {
    const result = spendHeart({ balance: MAX_HEARTS, lastRegenAtISO: null }, T0);
    expect(result.balance).toBe(MAX_HEARTS - 1);
    expect(result.lastRegenAtISO).toBe(T0.toISOString());
  });

  it('ne ide ispod nule', () => {
    const result = spendHeart({ balance: 0, lastRegenAtISO: T0.toISOString() }, hours(1));
    expect(result.balance).toBe(0);
  });

  it('NE resetira postojeći regen sat (drugi potrošak ne odgađa prvo srce)', () => {
    const afterFirst = spendHeart({ balance: MAX_HEARTS, lastRegenAtISO: null }, T0);
    const afterSecond = spendHeart(afterFirst, hours(1));
    expect(afterSecond.lastRegenAtISO).toBe(T0.toISOString());
  });
});

describe('resolveHearts', () => {
  it('puna zaliha je no-op', () => {
    const full = { balance: MAX_HEARTS, lastRegenAtISO: null };
    expect(resolveHearts(full, T0)).toEqual(full);
  });

  it('prije isteka intervala ništa se ne regenerira', () => {
    const state = { balance: 2, lastRegenAtISO: T0.toISOString() };
    expect(resolveHearts(state, hours(3.9))).toEqual(state);
  });

  it('svaka 4 sata vraća jedno srce', () => {
    const state = { balance: 1, lastRegenAtISO: T0.toISOString() };
    expect(resolveHearts(state, hours(4)).balance).toBe(2);
    expect(resolveHearts(state, hours(9)).balance).toBe(3);
  });

  it('regen sat zadržava "višak" vremena (9h = 2 srca + 1h prema trećem)', () => {
    const state = { balance: 1, lastRegenAtISO: T0.toISOString() };
    const resolved = resolveHearts(state, hours(9));
    expect(resolved.lastRegenAtISO).toBe(hours(8).toISOString());
  });

  it('kapa na MAX_HEARTS i tada gasi regen sat', () => {
    const state = { balance: 1, lastRegenAtISO: T0.toISOString() };
    const resolved = resolveHearts(state, hours(100));
    expect(resolved).toEqual({ balance: MAX_HEARTS, lastRegenAtISO: null });
  });
});

describe('grantHearts', () => {
  it('dodaje i kapa na MAX_HEARTS', () => {
    const state = { balance: 3, lastRegenAtISO: T0.toISOString() };
    const result = grantHearts(state, 10, hours(1));
    expect(result).toEqual({ balance: MAX_HEARTS, lastRegenAtISO: null });
  });

  it('+1 ispod maksimuma zadržava regen sat', () => {
    const state = { balance: 1, lastRegenAtISO: T0.toISOString() };
    const result = grantHearts(state, 1, hours(1));
    expect(result.balance).toBe(2);
    expect(result.lastRegenAtISO).toBe(T0.toISOString());
  });
});

describe('msUntilNextHeart', () => {
  it('null kad je zaliha puna', () => {
    expect(msUntilNextHeart({ balance: MAX_HEARTS, lastRegenAtISO: null }, T0)).toBeNull();
  });

  it('odbrojava do sljedećeg srca', () => {
    const state = { balance: 2, lastRegenAtISO: T0.toISOString() };
    expect(msUntilNextHeart(state, hours(1))).toBe(HEART_REGEN_INTERVAL_MS - 60 * 60 * 1000);
  });
});
