import { createDefaultProgressState, type ProgressStateV1 } from './progressTypes';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Pretvara nepoznati/možda pokvareni podatak iz localStorage u važeći ProgressStateV1.
 * Nepoznata/nevažeća verzija ili pokvaren oblik -> svjež default (gubitak podataka je
 * prihvatljiv, pad aplikacije nije). Kad se doda ProgressStateV2, ovdje se doda grana
 * `case 1: return migrateV1ToV2(raw as ProgressStateV1);` bez diranja ostatka koda.
 */
export function migrate(raw: unknown): ProgressStateV1 {
  if (!isPlainObject(raw)) {
    return createDefaultProgressState();
  }

  switch (raw.version) {
    case 1:
      return isValidV1(raw) ? (raw as unknown as ProgressStateV1) : createDefaultProgressState();
    default:
      return createDefaultProgressState();
  }
}

function isValidV1(raw: Record<string, unknown>): boolean {
  return (
    typeof raw.xpTotal === 'number' &&
    isPlainObject(raw.streak) &&
    typeof raw.streak.current === 'number' &&
    typeof raw.streak.longest === 'number' &&
    isPlainObject(raw.lessons) &&
    isPlainObject(raw.scoreStrike)
  );
}
