/** Lekcija: 10 XP po točnom odgovoru, 0 na fail (hearts su pale na 0). */
export function xpForLesson(passed: boolean, correctCount: number): number {
  return passed ? 10 * correctCount : 0;
}

/** Score Strike: uvijek se nagrađuje (nema fail-stanja), skalirano od ukupnog scorea. */
export function xpForScoreStrike(totalScore: number): number {
  return Math.round(totalScore / 20);
}
