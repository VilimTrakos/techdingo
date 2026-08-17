import { createDefaultProgressState, type ProgressStateV1 } from './progressTypes';
import { migrate } from './migrations';

const STORAGE_KEY = 'techdingo:progress:v1';

/**
 * localStorage.getItem/setItem mogu baciti (Safari private mode, quota
 * exceeded, storage onemogućen) - u tom slučaju aplikacija radi dalje s
 * in-memory stanjem, samo se napredak ne perzistira preko reloada.
 */
export function loadProgress(): ProgressStateV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return createDefaultProgressState();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.warn('techdingo: čitanje napretka iz localStorage nije uspjelo, koristim default.', err);
    return createDefaultProgressState();
  }
}

export function saveProgress(state: ProgressStateV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('techdingo: spremanje napretka u localStorage nije uspjelo.', err);
  }
}
