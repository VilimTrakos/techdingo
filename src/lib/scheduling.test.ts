import { describe, expect, it } from 'vitest';
import { BOX_INTERVAL_DAYS, MAX_BOX, applyAnswer, daysOverdue, isDue, isMastered } from './scheduling';

const T0 = new Date('2026-08-22T10:00:00');
const daysLater = (n: number) => new Date(T0.getTime() + n * 86_400_000);

describe('applyAnswer', () => {
  it('točan odgovor gura koncept u viši box (dulji razmak)', () => {
    const first = applyAnswer(undefined, true, T0);
    expect(first.box).toBe(1);
    expect(applyAnswer(first, true, T0).box).toBe(2);
  });

  it('kriv odgovor vraća na box 0 bez obzira koliko je bio visoko', () => {
    const high = { box: 4, lastSeenDateISO: '2026-08-01' };
    expect(applyAnswer(high, false, T0).box).toBe(0);
  });

  it('ne prelazi MAX_BOX', () => {
    let m = { box: MAX_BOX, lastSeenDateISO: '2026-08-01' };
    m = applyAnswer(m, true, T0);
    expect(m.box).toBe(MAX_BOX);
  });

  it('bilježi današnji datum kao zadnji susret', () => {
    expect(applyAnswer(undefined, true, T0).lastSeenDateISO).toBe('2026-08-22');
  });
});

describe('isDue', () => {
  it('neviđen koncept uvijek dospijeva', () => {
    expect(isDue(undefined, T0)).toBe(true);
  });

  it('box 0 (promašeno) dospijeva isti dan', () => {
    expect(isDue({ box: 0, lastSeenDateISO: '2026-08-22' }, T0)).toBe(true);
  });

  it('box 1 čeka jedan dan', () => {
    const m = { box: 1, lastSeenDateISO: '2026-08-22' };
    expect(isDue(m, T0)).toBe(false);
    expect(isDue(m, daysLater(1))).toBe(true);
  });

  it('viši box čeka dulje - to je smisao razmaknutog ponavljanja', () => {
    const m = { box: 3, lastSeenDateISO: '2026-08-22' };
    expect(isDue(m, daysLater(BOX_INTERVAL_DAYS[3] - 1))).toBe(false);
    expect(isDue(m, daysLater(BOX_INTERVAL_DAYS[3]))).toBe(true);
  });
});

describe('daysOverdue', () => {
  it('najzakašnjeliji koncept ima najveću vrijednost (za sortiranje)', () => {
    const staro = { box: 1, lastSeenDateISO: '2026-08-01' };
    const novije = { box: 1, lastSeenDateISO: '2026-08-20' };
    expect(daysOverdue(staro, T0)).toBeGreaterThan(daysOverdue(novije, T0));
  });
});

describe('isMastered', () => {
  it('tek zadnja kutija znači naučeno', () => {
    expect(isMastered({ box: MAX_BOX - 1, lastSeenDateISO: '2026-08-22' })).toBe(false);
    expect(isMastered({ box: MAX_BOX, lastSeenDateISO: '2026-08-22' })).toBe(true);
    expect(isMastered(undefined)).toBe(false);
  });
});

describe('ciklus učenja', () => {
  it('jedan točan odgovor NE znači naučeno - koncept se vraća kroz više lekcija', () => {
    // Ovo je bit korisnikova zahtjeva: prije je jedan pogodak trajno micao
    // pitanje s popisa. Sad treba MAX_BOX uzastopnih točnih odgovora.
    let m = applyAnswer(undefined, true, T0);
    let day = 0;
    let repeats = 0;
    while (!isMastered(m) && repeats < 20) {
      day += BOX_INTERVAL_DAYS[m.box];
      m = applyAnswer(m, true, daysLater(day));
      repeats++;
    }
    expect(isMastered(m)).toBe(true);
    expect(repeats).toBeGreaterThanOrEqual(4);
  });
});
