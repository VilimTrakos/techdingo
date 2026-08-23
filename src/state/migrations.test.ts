import { describe, expect, it } from 'vitest';
import { migrate } from './migrations';
import { isDue, lessonsOverdue } from '../lib/scheduling';

/**
 * Migracija je jedina stvar koja može tiho uništiti spremljeni napredak
 * korisnika, a do sad nije imala nijedan test.
 */
describe('migrate', () => {
  it('smeće i nepoznata verzija daju svjež default umjesto pada', () => {
    expect(migrate(null).version).toBe(4);
    expect(migrate('nonsense').version).toBe(4);
    expect(migrate({ version: 99 }).version).toBe(4);
    expect(migrate([]).version).toBe(4);
  });

  it('V1 -> V4 čuva XP, niz i napredak lekcija', () => {
    const v1 = {
      version: 1,
      xpTotal: 420,
      streak: { current: 3, longest: 9, lastCompletedDateISO: '2026-08-20' },
      lessons: { sql: { passCount: 4, failCount: 1, recentQuestionIds: ['a'] } },
      scoreStrike: { sql: { bestScore: 900, bestAtISO: '2026-08-01T00:00:00Z', playCount: 3, recentQuestionIds: [] } },
      updatedAtISO: '2026-08-20T10:00:00Z',
    };
    const out = migrate(v1);
    expect(out.version).toBe(4);
    expect(out.xpTotal).toBe(420);
    expect(out.streak.longest).toBe(9);
    expect(out.lessons.sql.passCount).toBe(4);
    expect(out.scoreStrike.sql.bestScore).toBe(900);
    expect(out.lessons.sql.struggledQuestionIds).toEqual([]);
    expect(out.mastery).toEqual({});
    expect(out.hearts.balance).toBe(5);
  });

  it('V2 -> V4 pretvara postojeće greške u koncepte koji odmah dospijevaju', () => {
    const v2 = {
      version: 2,
      xpTotal: 100,
      streak: { current: 1, longest: 1, lastCompletedDateISO: '2026-08-21' },
      lessons: {
        'sql/osnove-upita': {
          passCount: 1,
          failCount: 1,
          recentQuestionIds: [],
          struggledQuestionIds: ['sql-001-where-vs-having', 'sql-002-join-types'],
        },
      },
      scoreStrike: {},
      hearts: { balance: 3, lastRegenAtISO: null },
      dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
      updatedAtISO: '2026-08-21T10:00:00Z',
    };
    const out = migrate(v2);
    expect(out.version).toBe(4);
    // Greške nisu izgubljene - postale su koncepti u box 0.
    expect(Object.keys(out.mastery).sort()).toEqual(['sql-001-where-vs-having', 'sql-002-join-types']);
    expect(out.mastery['sql-001-where-vs-having'].box).toBe(0);
    // Srca preživljavaju migraciju (ne resetiraju se na 5).
    expect(out.hearts.balance).toBe(3);
    expect(out.lessons['sql/osnove-upita'].struggledQuestionIds).toHaveLength(2);
  });

  it('V3 -> V4 čuva stečene kutije i prebacuje razmak s dana na lekcije', () => {
    const v3 = {
      version: 3,
      xpTotal: 50,
      streak: { current: 0, longest: 0, lastCompletedDateISO: null },
      lessons: {
        'sql/osnove-upita': { passCount: 6, failCount: 2, recentQuestionIds: [], struggledQuestionIds: [] },
      },
      scoreStrike: {},
      mastery: {
        'sql-x': { box: 2, lastSeenDateISO: '2026-08-20' },
        'sql-y': { box: 0, lastSeenDateISO: '2026-08-21' },
      },
      hearts: { balance: 4, lastRegenAtISO: null },
      dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
      updatedAtISO: '2026-08-22T10:00:00Z',
    };
    const out = migrate(v3);
    expect(out.version).toBe(4);
    expect(out.xpTotal).toBe(50);
    // Stečeno znanje se ne poništava - box preživljava.
    expect(out.mastery['sql-x'].box).toBe(2);
    expect(out.mastery['sql-x'].lastSeenLesson).toBe(0);
    // Brojač lekcija se rekonstruira iz stvarne povijesti (6 + 2).
    expect(out.lessonCounter).toBe(8);
    // Sve dospijeva odmah, a slabije naučeno prije bolje naučenog.
    expect(isDue(out.mastery['sql-y'], out.lessonCounter)).toBe(true);
    expect(isDue(out.mastery['sql-x'], out.lessonCounter)).toBe(true);
    expect(lessonsOverdue(out.mastery['sql-y'], out.lessonCounter)).toBeGreaterThan(
      lessonsOverdue(out.mastery['sql-x'], out.lessonCounter),
    );
  });

  it('V3 bez ijedne odigrane lekcije i dalje daje brojač koji nešto znači', () => {
    const out = migrate({
      version: 3,
      xpTotal: 0,
      streak: { current: 0, longest: 0, lastCompletedDateISO: null },
      lessons: {},
      scoreStrike: {},
      mastery: { 'sql-z': { box: 0, lastSeenDateISO: '2026-08-21' } },
      hearts: { balance: 5, lastRegenAtISO: null },
      dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
      updatedAtISO: '2026-08-22T10:00:00Z',
    });
    expect(out.lessonCounter).toBeGreaterThanOrEqual(1);
    expect(isDue(out.mastery['sql-z'], out.lessonCounter)).toBe(true);
  });

  it('V4 prolazi kroz nepromijenjen', () => {
    const v4 = {
      version: 4,
      xpTotal: 50,
      streak: { current: 0, longest: 0, lastCompletedDateISO: null },
      lessons: {},
      scoreStrike: {},
      mastery: { 'sql-x': { box: 2, lastSeenLesson: 11 } },
      lessonCounter: 14,
      hearts: { balance: 4, lastRegenAtISO: null },
      dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
      updatedAtISO: '2026-08-22T10:00:00Z',
    };
    const out = migrate(v4);
    expect(out.mastery['sql-x']).toEqual({ box: 2, lastSeenLesson: 11 });
    expect(out.lessonCounter).toBe(14);
  });

  it('V4 bez lessonCounter-a je oštećen i pada na default', () => {
    const out = migrate({
      version: 4,
      xpTotal: 10,
      streak: { current: 0, longest: 0, lastCompletedDateISO: null },
      lessons: {},
      scoreStrike: {},
      mastery: {},
      hearts: { balance: 5, lastRegenAtISO: null },
      dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
      updatedAtISO: '2026-08-22T10:00:00Z',
    });
    expect(out.xpTotal).toBe(0);
  });

  it('oštećen V2 (nedostaje hearts) pada na default, ne ruši aplikaciju', () => {
    const broken = { version: 2, xpTotal: 10, streak: { current: 0, longest: 0 }, lessons: {}, scoreStrike: {} };
    expect(migrate(broken).xpTotal).toBe(0);
  });
});
