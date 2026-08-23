import { describe, expect, it } from 'vitest';
import { MAX_SESSION_SIZE, MIN_SESSION_SIZE, randomSessionSize, selectSessionPool } from './pool';
import type { Difficulty, Question } from '../types/question';

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/** Round-robin easy/medium/hard po zadanom redoslijedu, osim ako je `difficulty` fiksiran. */
function makeQuestions(count: number, topic = 'test', difficulty?: Difficulty): Question[] {
  const tiers: Difficulty[] = ['easy', 'medium', 'hard'];
  return Array.from({ length: count }, (_, i) => ({
    id: `${topic}-${i}`,
    topic,
    unitId: 'test-unit',
    question: `Pitanje ${i}?`,
    options: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    correctIndex: (i % 4) as 0 | 1 | 2 | 3,
    difficulty: difficulty ?? tiers[i % tiers.length],
  }));
}

describe('randomSessionSize', () => {
  it('vraća uvijek broj u rasponu [15, 17]', () => {
    for (let i = 0; i < 200; i++) {
      const size = randomSessionSize();
      expect(size).toBeGreaterThanOrEqual(MIN_SESSION_SIZE);
      expect(size).toBeLessThanOrEqual(MAX_SESSION_SIZE);
    }
  });
});

describe('selectSessionPool', () => {
  it('vraća traženu veličinu kad banka ima dovoljno pitanja', () => {
    const all = makeQuestions(25);
    const selected = selectSessionPool(all, [], 17);
    expect(selected).toHaveLength(17);
    const ids = new Set(selected.map((q) => q.id));
    expect(ids.size).toBe(17);
  });

  it('izbjegava recentIds kad god je to moguće', () => {
    const all = makeQuestions(25);
    const recentIds = all.slice(0, 10).map((q) => q.id);
    const selected = selectSessionPool(all, recentIds, 15);
    const overlap = selected.filter((q) => recentIds.includes(q.id));
    expect(overlap).toHaveLength(0);
  });

  it('popuni iz recentIds kad banka nema dovoljno svježih pitanja', () => {
    const all = makeQuestions(16);
    const recentIds = all.slice(0, 10).map((q) => q.id);
    const selected = selectSessionPool(all, recentIds, 15);
    expect(selected).toHaveLength(15);
    const ids = new Set(selected.map((q) => q.id));
    expect(ids.size).toBe(15);
  });

  it('nikad ne baca i vraća najviše onoliko koliko banka ima', () => {
    const all = makeQuestions(5);
    const selected = selectSessionPool(all, [], 17);
    expect(selected.length).toBe(5);
  });

  it('poredak rezultata je uvijek easy -> medium -> hard', () => {
    const all = makeQuestions(30);
    const selected = selectSessionPool(all, [], 17);
    const ranks = selected.map((q) => DIFFICULTY_RANK[q.difficulty]);
    const sortedRanks = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sortedRanks);
  });

  it('bira proporcionalno iz sve tri razine kad banka ima dovoljno svake', () => {
    const all = [
      ...makeQuestions(10, 'easy-topic', 'easy'),
      ...makeQuestions(10, 'medium-topic', 'medium'),
      ...makeQuestions(10, 'hard-topic', 'hard'),
    ];
    const selected = selectSessionPool(all, [], 15);
    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const q of selected) counts[q.difficulty]++;
    expect(counts).toEqual({ easy: 5, medium: 5, hard: 5 });
  });

  it('prebacuje manjak jedne razine na sljedeću kad ta razina nema dovoljno pitanja', () => {
    const all = [
      ...makeQuestions(2, 'easy-topic', 'easy'),
      ...makeQuestions(20, 'medium-topic', 'medium'),
      ...makeQuestions(20, 'hard-topic', 'hard'),
    ];
    const selected = selectSessionPool(all, [], 15);
    expect(selected).toHaveLength(15);
    const counts = { easy: 0, medium: 0, hard: 0 };
    for (const q of selected) counts[q.difficulty]++;
    expect(counts.easy).toBe(2);
    expect(counts.medium + counts.hard).toBe(13);
  });
});

describe('selectSessionPool - razmakom vođeno ponavljanje (u lekcijama)', () => {
  it('dospjeli koncepti dobivaju mjesto u sesiji', () => {
    const bank = makeQuestions(60);
    // Prvih 5 pitanja: viđena u lekciji 0, box 1 (razmak 2) -> odavno dospjela.
    const mastery = Object.fromEntries(
      bank.slice(0, 5).map((q) => [q.id, { box: 1, lastSeenLesson: 0 }]),
    );
    const selected = selectSessionPool(bank, [], 15, { mastery, lessonCounter: 12 });
    const dueIds = new Set(Object.keys(mastery));
    expect(selected.filter((q) => dueIds.has(q.id)).length).toBeGreaterThan(0);
  });

  it('promašen koncept se vraća već u sljedećoj lekciji', () => {
    // Ovo je konkretno ono što je korisnik tražio: ne "za tri dana" nego
    // "iduću lekciju".
    const bank = makeQuestions(60);
    const missed = bank[0];
    const mastery = { [missed.id]: { box: 0, lastSeenLesson: 7 } };
    const selected = selectSessionPool(bank, [], 15, { mastery, lessonCounter: 8 });
    expect(selected.some((q) => q.id === missed.id)).toBe(true);
  });

  it('koncept koji JOŠ NIJE dospio se ne gura u sesiju kao ponavljanje', () => {
    const bank = makeQuestions(60);
    // Box 5 viđen prošlu lekciju -> razmak je 13 lekcija, daleko od roka.
    const mastery = { [bank[0].id]: { box: 5, lastSeenLesson: 7 } };
    let appearedAsDue = 0;
    for (let i = 0; i < 30; i++) {
      const selected = selectSessionPool(bank, [], 15, { mastery, lessonCounter: 8 });
      // Ako bi se tretiralo kao dospjelo, pojavilo bi se dvaput (i kao
      // ponavljanje i iz redovnog odabira po težini).
      if (selected.filter((q) => q.id === bank[0].id).length > 1) {
        appearedAsDue++;
      }
    }
    expect(appearedAsDue).toBe(0);
  });

  it('kad koncept ima više varijanti, bira onu koju igrač nije zadnji put vidio', () => {
    const bank = makeQuestions(30);
    // Dvije varijante istog koncepta; jedna je bila u prošloj sesiji.
    bank[0] = { ...bank[0], conceptId: 'koncept-x' };
    bank[1] = { ...bank[1], conceptId: 'koncept-x' };
    const mastery = { 'koncept-x': { box: 1, lastSeenLesson: 0 } };

    for (let i = 0; i < 20; i++) {
      const selected = selectSessionPool(bank, [bank[0].id], 15, {
        mastery,
        lessonCounter: 12,
      });
      // Prvo mjesto u odabiru ponavljanja nikad ne smije biti viđena varijanta.
      expect(selected[0].id).not.toBe(bank[0].id);
    }
  });

  it('bez mastery podataka ponaša se kao i prije (bez regresije)', () => {
    const bank = makeQuestions(60);
    const selected = selectSessionPool(bank, [], 15);
    expect(selected).toHaveLength(15);
    expect(new Set(selected.map((q) => q.id)).size).toBe(15);
  });
});

describe('selectSessionPool - uvodna pitanja', () => {
  function bankWithIntro(): Question[] {
    const bank = makeQuestions(40);
    bank[10] = { ...bank[10], isIntro: true, difficulty: 'easy' };
    bank[20] = { ...bank[20], isIntro: true, difficulty: 'easy' };
    return bank;
  }

  it('prva lekcija u cjelini garantirano počinje uvodnim pitanjima', () => {
    const bank = bankWithIntro();
    for (let i = 0; i < 15; i++) {
      const selected = selectSessionPool(bank, [], 10, { isFirstVisit: true });
      expect(selected[0].isIntro).toBe(true);
      expect(selected[1].isIntro).toBe(true);
      expect(selected.filter((q) => q.isIntro).length).toBe(2);
    }
  });

  it('uvodna pitanja idu prva i kad su odabrana redovnim putem', () => {
    const bank = bankWithIntro();
    for (let i = 0; i < 15; i++) {
      const selected = selectSessionPool(bank, [], 10, { isFirstVisit: false });
      const firstIntro = selected.findIndex((q) => q.isIntro);
      const lastNonIntro = selected.map((q) => Boolean(q.isIntro)).lastIndexOf(false);
      if (firstIntro !== -1) {
        expect(firstIntro).toBeLessThan(lastNonIntro);
      }
    }
  });

  it('nakon prve lekcije uvod se ne nameće', () => {
    const bank = bankWithIntro();
    // Bez isFirstVisit uvodna pitanja se natječu kao i sva druga - u barem
    // jednoj od mnogo sesija smiju izostati.
    const runs = Array.from({ length: 40 }, () =>
      selectSessionPool(bank, [], 10).filter((q) => q.isIntro).length,
    );
    expect(Math.min(...runs)).toBeLessThan(2);
  });
});
