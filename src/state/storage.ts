import { createDefaultProgressState, type ProgressState } from './progressTypes';
import { migrate } from './migrations';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const STORAGE_KEY = 'techdingo:progress:v1';

/**
 * localStorage.getItem/setItem mogu baciti (Safari private mode, quota
 * exceeded, storage onemogućen) - u tom slučaju aplikacija radi dalje s
 * in-memory stanjem, samo se napredak ne perzistira preko reloada.
 */
export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return createDefaultProgressState();
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);

    // Migrirano stanje odmah zapiši natrag. Bez ovoga bi na disku ostala
    // stara verzija dok korisnik ne odigra nešto, pa bi se migracija vrtjela
    // pri svakom učitavanju - a migracije koje ovise o "danas" (V2->V3 sjeda
    // greške na jučerašnji datum) svaki put davale malo drugačiji rezultat.
    if (!isPlainObject(parsed) || parsed.version !== migrated.version) {
      saveProgress(migrated);
    }
    return migrated;
  } catch (err) {
    console.warn('techdingo: čitanje napretka iz localStorage nije uspjelo, koristim default.', err);
    return createDefaultProgressState();
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('techdingo: spremanje napretka u localStorage nije uspjelo.', err);
  }
}
