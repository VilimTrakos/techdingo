import { UNITS, unitProgressKey } from '../data/units';
import type { ProgressState } from '../state/progressTypes';

export interface AchievementDefinition {
  id: string;
  labelHr: string;
  description: string;
  icon: string;
  earned: (state: ProgressState) => boolean;
}

function completedUnitCount(state: ProgressState): number {
  return Object.values(UNITS)
    .flat()
    .filter((unit) => (state.lessons[unitProgressKey(unit.topicId, unit.id)]?.passCount ?? 0) > 0)
    .length;
}

function allTopicUnitsCompleted(state: ProgressState, topicId: string): boolean {
  const units = UNITS[topicId] ?? [];
  return units.length > 0 && units.every(
    (unit) => (state.lessons[unitProgressKey(topicId, unit.id)]?.passCount ?? 0) > 0,
  );
}

function totalScoreStrikeRuns(state: ProgressState): number {
  return Object.values(state.scoreStrike).reduce((total, entry) => total + entry.playCount, 0);
}

function bestScoreStrikeScore(state: ProgressState): number {
  return Math.max(0, ...Object.values(state.scoreStrike).map((entry) => entry.bestScore));
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'xp-prvi-korak',
    labelHr: 'Prvi korak',
    description: 'Osvoji 100 XP.',
    icon: '🌱',
    earned: (state) => state.xpTotal >= 100,
  },
  {
    id: 'xp-u-zamahu',
    labelHr: 'U zamahu',
    description: 'Osvoji 500 XP.',
    icon: '🚀',
    earned: (state) => state.xpTotal >= 500,
  },
  {
    id: 'xp-legenda',
    labelHr: 'XP legenda',
    description: 'Osvoji 2.000 XP.',
    icon: '👑',
    earned: (state) => state.xpTotal >= 2_000,
  },
  {
    id: 'niz-tri-dana',
    labelHr: 'Zagrijavanje',
    description: 'Dosegni niz od 3 dana.',
    icon: '🔥',
    earned: (state) => state.streak.longest >= 3,
  },
  {
    id: 'niz-sedam-dana',
    labelHr: 'Cijeli tjedan',
    description: 'Dosegni niz od 7 dana.',
    icon: '🗓️',
    earned: (state) => state.streak.longest >= 7,
  },
  {
    id: 'niz-trideset-dana',
    labelHr: 'Nezaustavljiv',
    description: 'Dosegni niz od 30 dana.',
    icon: '☄️',
    earned: (state) => state.streak.longest >= 30,
  },
  {
    id: 'prva-cjelina',
    labelHr: 'Prva cjelina',
    description: 'Završi bilo koju cjelinu učenja.',
    icon: '✅',
    earned: (state) => completedUnitCount(state) >= 1,
  },
  {
    id: 'deset-cjelina',
    labelHr: 'Istraživač',
    description: 'Završi 10 različitih cjelina.',
    icon: '🧭',
    earned: (state) => completedUnitCount(state) >= 10,
  },
  {
    id: 'sql-majstor',
    labelHr: 'SQL majstor',
    description: 'Završi sve SQL cjeline.',
    icon: '▤',
    earned: (state) => allTopicUnitsCompleted(state, 'sql'),
  },
  {
    id: 'sve-cjeline',
    labelHr: 'TechDingo prvak',
    description: 'Završi sve cjeline u svim temama.',
    icon: '🏆',
    earned: (state) => Object.keys(UNITS).every((topicId) => allTopicUnitsCompleted(state, topicId)),
  },
  {
    id: 'prvi-score-strike',
    labelHr: 'Uđi u arenu',
    description: 'Dovrši prvu Score Strike rundu.',
    icon: '⚡',
    earned: (state) => totalScoreStrikeRuns(state) >= 1,
  },
  {
    id: 'score-strike-deset',
    labelHr: 'Arena veteran',
    description: 'Dovrši 10 Score Strike rundi.',
    icon: '🥊',
    earned: (state) => totalScoreStrikeRuns(state) >= 10,
  },
  {
    id: 'score-strike-tisucu',
    labelHr: 'Četiri znamenke',
    description: 'Postigni najmanje 1.000 bodova u jednoj Score Strike rundi.',
    icon: '💥',
    earned: (state) => bestScoreStrikeScore(state) >= 1_000,
  },
  {
    id: 'score-strike-pet-tisuca',
    labelHr: 'Rušitelj rekorda',
    description: 'Postigni najmanje 5.000 bodova u jednoj Score Strike rundi.',
    icon: '💎',
    earned: (state) => bestScoreStrikeScore(state) >= 5_000,
  },
  {
    id: 'dnevni-izazov',
    labelHr: 'Dnevna doza',
    description: 'Dovrši dnevni izazov.',
    icon: '📅',
    earned: (state) => state.dailyChallenge.lastPlayedDateISO !== null,
  },
  {
    id: 'povratak-nakon-pada',
    labelHr: 'Nema predaje',
    description: 'Nakon neuspjeha uspješno završi istu cjelinu.',
    icon: '🛡️',
    earned: (state) => Object.values(state.lessons).some(
      (lesson) => lesson.failCount > 0 && lesson.passCount > 0,
    ),
  },
];
