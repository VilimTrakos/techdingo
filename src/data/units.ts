// Lekcijske cjeline (podteme) unutar svake teme, poredane od osnovnih prema
// složenima - redoslijed ovdje JE redoslijed otključavanja na putu učenja.
// Svako pitanje u src/data/questions/*.json nosi unitId koji mora postojati
// ovdje (provjerava scripts/validate-questions.ts).

export interface UnitDefinition {
  id: string;
  topicId: string;
  labelHr: string;
  description: string;
}

export const UNITS: Record<string, UnitDefinition[]> = {
  sql: [
    { id: 'osnove-upita', topicId: 'sql', labelHr: 'Osnove upita', description: 'SELECT, WHERE, ORDER BY, aliasi i operatori.' },
    { id: 'tipovi-i-null', topicId: 'sql', labelHr: 'Tipovi i NULL', description: 'Tipovi podataka, datumi i zamke NULL vrijednosti.' },
    { id: 'izmjene-podataka', topicId: 'sql', labelHr: 'Izmjene podataka', description: 'INSERT, UPDATE, DELETE i sigurne izmjene.' },
    { id: 'spajanje-i-skupovi', topicId: 'sql', labelHr: 'JOIN-ovi i skupovi', description: 'Vrste JOIN-ova, UNION, INTERSECT i EXCEPT.' },
    { id: 'agregacija-i-window', topicId: 'sql', labelHr: 'Agregacija i window', description: 'GROUP BY, HAVING i window funkcije.' },
    { id: 'podupiti-pogledi', topicId: 'sql', labelHr: 'Podupiti i pogledi', description: 'Podupiti, CTE, pogledi i rutine.' },
    { id: 'kljucevi-i-dizajn', topicId: 'sql', labelHr: 'Ključevi i dizajn', description: 'Ključevi, ograničenja i normalizacija sheme.' },
    { id: 'indeksi-performanse', topicId: 'sql', labelHr: 'Indeksi i performanse', description: 'Indeksi, planovi izvršavanja i optimizacija.' },
    { id: 'transakcije', topicId: 'sql', labelHr: 'Transakcije', description: 'ACID, izolacija, zaključavanje i konkurentnost.' },
    { id: 'sigurnost', topicId: 'sql', labelHr: 'Sigurnost', description: 'SQL injection, ovlasti i sigurne migracije.' },
  ],
  frontend: [
    { id: 'osnove-weba', topicId: 'frontend', labelHr: 'Osnove weba', description: 'HTML semantika, forme i temelji weba.' },
    { id: 'js-jezik', topicId: 'frontend', labelHr: 'JavaScript jezik', description: 'Varijable, funkcije, closure i TypeScript.' },
    { id: 'dom-eventovi', topicId: 'frontend', labelHr: 'DOM i eventovi', description: 'Rad s DOM-om, eventovi i delegacija.' },
    { id: 'css-layout', topicId: 'frontend', labelHr: 'CSS i layout', description: 'Flexbox, Grid, responzivnost i specifičnost.' },
    { id: 'asinkroni-js', topicId: 'frontend', labelHr: 'Asinkroni JS', description: 'Promise, async/await i event loop.' },
    { id: 'react', topicId: 'frontend', labelHr: 'React', description: 'Komponente, state, hookovi i renderiranje.' },
    { id: 'mreza-sigurnost', topicId: 'frontend', labelHr: 'Mreža i sigurnost', description: 'HTTP, fetch, CORS, spremanje i sigurnost.' },
    { id: 'pristupacnost-testiranje', topicId: 'frontend', labelHr: 'Pristupačnost i testiranje', description: 'A11y obrasci i testiranje sučelja.' },
    { id: 'performanse', topicId: 'frontend', labelHr: 'Performanse', description: 'Optimizacija renderiranja i učitavanja.' },
  ],
  backend: [
    { id: 'http-api', topicId: 'backend', labelHr: 'HTTP i API dizajn', description: 'REST, metode, statusi i evolucija API-ja.' },
    { id: 'autentikacija-sigurnost', topicId: 'backend', labelHr: 'Autentikacija i sigurnost', description: 'Auth, tokeni, lozinke i tajne.' },
    { id: 'arhitektura', topicId: 'backend', labelHr: 'Arhitektura', description: 'Slojevi, middleware, servisi i deploy.' },
    { id: 'baze-podataka', topicId: 'backend', labelHr: 'Baze podataka', description: 'Indeksi, transakcije, replike i migracije.' },
    { id: 'kesiranje-skaliranje', topicId: 'backend', labelHr: 'Keširanje i skaliranje', description: 'Cache strategije i horizontalno skaliranje.' },
    { id: 'poruke-redovi', topicId: 'backend', labelHr: 'Poruke i redovi', description: 'Message queue obrasci i isporuka poruka.' },
    { id: 'otpornost-distribuirani', topicId: 'backend', labelHr: 'Otpornost i distribuirani sustavi', description: 'Retry, circuit breaker, konsenzus i konkurentnost.' },
    { id: 'observability', topicId: 'backend', labelHr: 'Observability', description: 'Logovi, metrike, tragovi i SLO ciljevi.' },
  ],
  general: [
    { id: 'strukture-podataka', topicId: 'general', labelHr: 'Strukture podataka', description: 'Polja, stogovi, redovi, mape i stabla.' },
    { id: 'algoritmi', topicId: 'general', labelHr: 'Algoritmi', description: 'Big-O, pretraživanje, sortiranje i grafovi.' },
    { id: 'oop-dizajn', topicId: 'general', labelHr: 'OOP i dizajn', description: 'SOLID, enkapsulacija i dizajn koda.' },
    { id: 'git-verzioniranje', topicId: 'general', labelHr: 'Git i verzioniranje', description: 'Commit, branch, merge, rebase i alati.' },
    { id: 'testiranje-kvaliteta', topicId: 'general', labelHr: 'Testiranje i kvaliteta', description: 'Vrste testova, mockovi i code review.' },
    { id: 'sustavi-koncepti', topicId: 'general', labelHr: 'Sustavi i koncepti', description: 'Procesi, cache, CAP i system design.' },
  ],
};

export function getUnitsForTopic(topicId: string): UnitDefinition[] {
  return UNITS[topicId] ?? [];
}

export function getUnit(topicId: string, unitId: string): UnitDefinition | undefined {
  return getUnitsForTopic(topicId).find((u) => u.id === unitId);
}

/** Ključ pod kojim se napredak cjeline sprema u ProgressState.lessons. */
export function unitProgressKey(topicId: string, unitId: string): string {
  return `${topicId}/${unitId}`;
}
