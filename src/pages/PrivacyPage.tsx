import { Link } from 'react-router-dom';

/**
 * Stranica o privatnosti. Postoji jer aplikacija skuplja e-mail i javno
 * prikazuje ime na ljestvici, a nigdje nije pisalo što se sprema ni kako se
 * briše - iako `delete_account()` i gumb za brisanje postoje od ranije.
 *
 * Svaka tvrdnja ovdje mora ostati istinita. Ako se doda analitika, oglasi ili
 * bilo koji vanjski servis, mijenja se i ovaj tekst.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border-2 border-cloud-200 bg-white p-6 shadow-[0_4px_0_#e2e9df] sm:p-8">
      <h2 className="text-xl font-black text-ink-950 sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 font-medium leading-7 text-ink-600">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <header className="rounded-[2rem] border-2 border-brand-200 bg-brand-50 px-6 py-8 text-center shadow-[0_6px_0_#b8efc1] sm:px-10">
        <p className="text-5xl" aria-hidden="true">🔒</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-ink-950 sm:text-5xl">
          Privatnost
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-bold text-ink-600">
          Kratko i bez sitnog tiska: što se sprema, gdje, i kako to obrisati.
        </p>
      </header>

      <Section title="Bez računa ne skupljamo ništa">
        <p>
          Ako se ne prijaviš, tvoj napredak — XP, niz, prođene cjeline, srca —
          živi isključivo u tvom pregledniku (localStorage). Ne šalje se nikamo
          i mi ga ne vidimo. Brisanjem podataka preglednika nestaje.
        </p>
      </Section>

      <Section title="S računom">
        <p>
          <strong className="text-ink-950">E-mail</strong> služi samo za prijavu
          i oporavak lozinke. Ne prikazuje se drugim igračima i ne koristi se ni
          za što drugo.
        </p>
        <p>
          <strong className="text-ink-950">Ime na ljestvici je javno.</strong>{' '}
          Zadano je nasumično, u obliku <code className="rounded bg-cloud-100 px-1.5 py-0.5 font-mono text-sm">Player-1a2b3c4d</code>,
          i nikad se ne izvodi iz tvog e-maila. Ako ga promijeniš na{' '}
          <Link to="/leaderboard" className="font-bold text-brand-700 underline">ljestvici</Link>,
          vide ga svi — nemoj upisati ništa što ne želiš pokazati.
        </p>
        <p>
          <strong className="text-ink-950">Napredak</strong> se sinkronizira da
          ga imaš na više uređaja: XP, niz, rezultati i popis pitanja koja si
          promašio. Sadržaj tvojih odgovora se ne sprema.
        </p>
        <p>
          <strong className="text-ink-950">Srca i dnevni izazov</strong> ostaju
          samo na uređaju i namjerno se ne sinkroniziraju.
        </p>
      </Section>

      <Section title="Nema pratitelja">
        <p>
          Nema Google Analyticsa, nema oglasnih mreža, nema piksela ni bilo kakve
          skripte treće strane. Jedini vanjski servis je Supabase, koji poslužuje
          račune i sinkronizaciju.
        </p>
      </Section>

      <Section title="Brisanje">
        <p>
          Račun brišeš sam, u panelu računa gore desno → <strong className="text-ink-950">Obriši račun</strong>.
          Briše se odmah i nepovratno, zajedno sa svime što je uz njega vezano.
        </p>
        <p>
          Napredak samo na ovom uređaju brišeš u{' '}
          <Link to="/postavke" className="font-bold text-brand-700 underline">postavkama</Link>.
        </p>
      </Section>

      <Section title="Pitanja">
        <p>
          Piši na{' '}
          <a href="mailto:forscommh@gmail.com" className="font-bold text-brand-700 underline">
            forscommh@gmail.com
          </a>
          . Kod je otvoren i možeš provjeriti sve gore navedeno:{' '}
          <a
            href="https://github.com/VilimTrakos/techdingo"
            className="font-bold text-brand-700 underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/VilimTrakos/techdingo
          </a>
          .
        </p>
      </Section>

      <div className="text-center">
        <Link to="/" className="game-button game-button-primary px-6 py-3">
          Natrag na teme
        </Link>
      </div>
    </div>
  );
}

export default PrivacyPage;
