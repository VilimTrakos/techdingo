/** Koliko čekamo cloud odgovor prije nego korisniku javimo da ne ide. */
export const CLOUD_TIMEOUT_MS = 8000;

export class TimeoutError extends Error {
  constructor(what: string) {
    super(`Isteklo vrijeme čekanja: ${what}`);
    this.name = 'TimeoutError';
  }
}

/**
 * Ograničava koliko dugo čekamo obećanje.
 *
 * Postoji jer supabase-js sam ponavlja pokušaje kad poslužitelj nije
 * dostupan: kad je projekt bio nedostupan, ljestvica je stajala na
 * "Učitavamo…" punih 15 sekundi prije nego se pojavila poruka. Odgovor
 * "ne ide" nakon 8 sekundi je za korisnika daleko bolji od 15 sekundi
 * bez ijedne informacije.
 *
 * Ne prekida sam mrežni zahtjev - samo prestaje čekati na njega.
 */
export function withTimeout<T>(promise: PromiseLike<T>, what: string, ms = CLOUD_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(what)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
