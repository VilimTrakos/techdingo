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
  devops: [
    { id: 'linux-shell', topicId: 'devops', labelHr: 'Linux i shell', description: 'Naredbe, dozvole, procesi i cijevi.' },
    { id: 'kontejneri', topicId: 'devops', labelHr: 'Kontejneri', description: 'Docker, imagei, slojevi i volumeni.' },
    { id: 'ci-cd', topicId: 'devops', labelHr: 'CI/CD', description: 'Pipeline, testovi, artefakti i tajne.' },
    { id: 'orkestracija', topicId: 'devops', labelHr: 'Orkestracija', description: 'Kubernetes: podovi, servisi i rollout.' },
    { id: 'deploy-strategije', topicId: 'devops', labelHr: 'Deploy strategije', description: 'Blue-green, canary, flagovi i povratak.' },
    { id: 'infrastruktura-kao-kod', topicId: 'devops', labelHr: 'Infrastruktura kao kod', description: 'Deklarativni opis, state i drift.' },
    { id: 'cloud-osnove', topicId: 'devops', labelHr: 'Osnove oblaka', description: 'Regije, IAM, serverless i troškovi.' },
    { id: 'nadzor-produkcije', topicId: 'devops', labelHr: 'Nadzor produkcije', description: 'Alarmi, SLO, dežurstvo i postmortem.' },
  ],
  mreze: [
    { id: 'osnove-mreza', topicId: 'mreze', labelHr: 'Osnove mreža', description: 'IP adrese, portovi, paketi i slojevi.' },
    { id: 'tcp-udp', topicId: 'mreze', labelHr: 'TCP i UDP', description: 'Pouzdanost, handshake i zagušenje.' },
    { id: 'dns', topicId: 'mreze', labelHr: 'DNS', description: 'Zapisi, TTL, keš i razrješavanje imena.' },
    { id: 'http-protokol', topicId: 'mreze', labelHr: 'HTTP protokol', description: 'Metode, statusi, zaglavlja i HTTP/2-3.' },
    { id: 'tls-sigurna-veza', topicId: 'mreze', labelHr: 'TLS i HTTPS', description: 'Certifikati, handshake i povjerenje.' },
    { id: 'realtime', topicId: 'mreze', labelHr: 'Stvarno vrijeme', description: 'WebSocket, SSE, polling i webhookovi.' },
    { id: 'isporuka-prometa', topicId: 'mreze', labelHr: 'Isporuka prometa', description: 'Load balanceri, proxy, CDN i limiti.' },
    { id: 'dijagnostika-mreze', topicId: 'mreze', labelHr: 'Dijagnostika', description: 'Ping, traceroute, kašnjenje i timeouti.' },
  ],
  sigurnost: [
    { id: 'osnove-sigurnosti', topicId: 'sigurnost', labelHr: 'Osnove sigurnosti', description: 'Načela, prijetnje i obrana u dubinu.' },
    { id: 'injekcije', topicId: 'sigurnost', labelHr: 'Injekcije', description: 'SQL, naredbe, predlošci i obrane.' },
    { id: 'xss-csrf', topicId: 'sigurnost', labelHr: 'XSS i CSRF', description: 'Napadi u pregledniku, kolačići i CSP.' },
    { id: 'autentikacija-sesije', topicId: 'sigurnost', labelHr: 'Prijava i sesije', description: 'Lozinke, sažimanje, MFA i tokeni.' },
    { id: 'autorizacija', topicId: 'sigurnost', labelHr: 'Autorizacija', description: 'Uloge, IDOR i podizanje ovlasti.' },
    { id: 'kriptografija-praksa', topicId: 'sigurnost', labelHr: 'Kriptografija u praksi', description: 'Hash, sol, ključevi i HMAC.' },
    { id: 'tajne-i-ovisnosti', topicId: 'sigurnost', labelHr: 'Tajne i ovisnosti', description: 'Trezori, opskrbni lanac i ranjivi paketi.' },
    { id: 'privatnost', topicId: 'sigurnost', labelHr: 'Privatnost', description: 'Osobni podaci, rokovi i curenja.' },
  ],
  'cudni-kutovi': [
    { id: 'brojevi', topicId: 'cudni-kutovi', labelHr: 'Brojevi koji lažu', description: 'Pomični zarez, prelijevanje i novac.' },
    { id: 'tekst-i-znakovi', topicId: 'cudni-kutovi', labelHr: 'Tekst i znakovi', description: 'Unicode, UTF-8, emoji i normalizacija.' },
    { id: 'vrijeme', topicId: 'cudni-kutovi', labelHr: 'Vrijeme', description: 'UTC, zone, ljetno računanje i 2038.' },
    { id: 'regex-i-parsiranje', topicId: 'cudni-kutovi', labelHr: 'Regex i parsiranje', description: 'Uzorci, pohlepnost i ReDoS.' },
    { id: 'bitovi-i-memorija', topicId: 'cudni-kutovi', labelHr: 'Bitovi i memorija', description: 'Endianness, komplement i maske.' },
    { id: 'slucajnost-i-id', topicId: 'cudni-kutovi', labelHr: 'Slučajnost i ID-jevi', description: 'PRNG, UUID i vjerojatnost sudara.' },
    { id: 'slavni-bugovi', topicId: 'cudni-kutovi', labelHr: 'Slavni bugovi', description: 'Ariane 5, Mars, null i Knight Capital.' },
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
