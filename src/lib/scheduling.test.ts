import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVAL_LESSONS,
  LESSONS_TO_MASTERY,
  MAX_BOX,
  applyAnswer,
  isDue,
  isMastered,
  lessonsOverdue,
} from './scheduling';

describe('applyAnswer', () => {
  it('točan odgovor gura koncept u viši box (dulji razmak)', () => {
    const first = applyAnswer(undefined, true, 0);
    expect(first.box).toBe(1);
    expect(applyAnswer(first, true, 1).box).toBe(2);
  });

  it('kriv odgovor vraća na box 0 bez obzira koliko je bio visoko', () => {
    expect(applyAnswer({ box: 4, lastSeenLesson: 3 }, false, 10).box).toBe(0);
  });

  it('ne prelazi MAX_BOX', () => {
    expect(applyAnswer({ box: MAX_BOX, lastSeenLesson: 1 }, true, 9).box).toBe(MAX_BOX);
  });

  it('bilježi broj odigranih lekcija kao trenutak zadnjeg susreta', () => {
    expect(applyAnswer(undefined, true, 7).lastSeenLesson).toBe(7);
  });
});

describe('isDue', () => {
  it('neviđen koncept uvijek dospijeva', () => {
    expect(isDue(undefined, 0)).toBe(true);
  });

  it('promašen koncept (box 0) vraća se već u SLJEDEĆOJ lekciji', () => {
    // Ovo je srž korisnikova zahtjeva: ono što nisi znao ne čeka danima.
    const missed = applyAnswer({ box: 3, lastSeenLesson: 0 }, false, 4);
    expect(isDue(missed, 4)).toBe(false); // ista lekcija - ne odmah opet
    expect(isDue(missed, 5)).toBe(true); // iduća lekcija - da
  });

  it('box 1 preskače jednu lekciju', () => {
    const m = { box: 1, lastSeenLesson: 10 };
    expect(isDue(m, 11)).toBe(false);
    expect(isDue(m, 12)).toBe(true);
  });

  it('viši box čeka dulje - to je smisao razmaknutog ponavljanja', () => {
    const m = { box: 3, lastSeenLesson: 0 };
    expect(isDue(m, BOX_INTERVAL_LESSONS[3] - 1)).toBe(false);
    expect(isDue(m, BOX_INTERVAL_LESSONS[3])).toBe(true);
  });
});

describe('lessonsOverdue', () => {
  it('najzakašnjeliji koncept ima najveću vrijednost (za sortiranje)', () => {
    const davno = { box: 1, lastSeenLesson: 2 };
    const nedavno = { box: 1, lastSeenLesson: 18 };
    expect(lessonsOverdue(davno, 20)).toBeGreaterThan(lessonsOverdue(nedavno, 20));
  });

  it('slabije naučen koncept preteče bolje naučen pri istom zadnjem susretu', () => {
    const slabo = { box: 0, lastSeenLesson: 5 };
    const dobro = { box: 4, lastSeenLesson: 5 };
    expect(lessonsOverdue(slabo, 10)).toBeGreaterThan(lessonsOverdue(dobro, 10));
  });
});

describe('isMastered', () => {
  it('tek zadnja kutija znači naučeno', () => {
    expect(isMastered({ box: MAX_BOX - 1, lastSeenLesson: 0 })).toBe(false);
    expect(isMastered({ box: MAX_BOX, lastSeenLesson: 0 })).toBe(true);
    expect(isMastered(undefined)).toBe(false);
  });
});

describe('ciklus učenja', () => {
  it('koncept se vraća kroz lekcije, ne kroz dane', () => {
    // Simulira igrača koji odigra niz lekcija zaredom (isti dan ili kroz
    // tjedan - svejedno je, brojač su lekcije) i svaki put pogodi.
    let mastery = applyAnswer(undefined, true, 0);
    const vidjenoUlekcijama = [1];

    for (let lesson = 1; lesson < 40 && !isMastered(mastery); lesson++) {
      if (isDue(mastery, lesson)) {
        vidjenoUlekcijama.push(lesson + 1);
        mastery = applyAnswer(mastery, true, lesson);
      }
    }

    expect(isMastered(mastery)).toBe(true);
    expect(vidjenoUlekcijama).toEqual([1, 3, 6, 11, 19]);
    expect(vidjenoUlekcijama.at(-1)).toBe(LESSONS_TO_MASTERY);
  });

  it('promašaj usred niza vraća koncept na početak, u iduću lekciju', () => {
    let mastery = { box: 4, lastSeenLesson: 0 };
    mastery = applyAnswer(mastery, false, 12);
    expect(mastery.box).toBe(0);
    expect(isDue(mastery, 13)).toBe(true);
  });
});
