import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TOPICS } from '../data/topics';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN, useProfile } from '../hooks/useProfile';

const TABS: { id: string; labelHr: string }[] = [
  { id: 'mixed', labelHr: 'Sve teme' },
  ...TOPICS.map((t) => ({ id: t.id, labelHr: t.labelHr })),
];

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('mixed');
  const { entries, isLoading, error, isCloudEnabled, refresh } = useLeaderboard(activeTab);
  const profile = useProfile();

  if (!isCloudEnabled) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-cloud-200 bg-white p-8 text-center shadow-card sm:p-10">
        <p className="text-5xl" aria-hidden="true">🏆</p>
        <h1 className="mt-4 text-3xl font-black text-ink-950">Ljestvica nije dostupna</h1>
        <p className="mt-3 font-medium leading-7 text-ink-600">
          Ova instanca aplikacije nema konfiguriran cloud backend, pa je
          ljestvica isključena. Solo vježbanje radi normalno.
        </p>
        <Link to="/" className="game-button game-button-primary mt-6 px-6 py-3">
          Natrag na teme
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-10">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-ink-950 sm:text-5xl">
          <span aria-hidden="true">🏆</span> Ljestvica
        </h1>
        <p className="mt-2 font-bold text-ink-600">
          Najbolji Score Strike rezultati svih igrača
        </p>
      </header>

      {profile.isSignedIn && <DisplayNameEditor profile={profile} />}

      <div
        className="flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="Odaberi temu ljestvice"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-10 rounded-xl border-2 px-4 py-2 text-sm font-black transition ${
              tab.id === activeTab
                ? 'border-brand-300 bg-brand-100 text-brand-700 shadow-[0_2px_0_#82df91]'
                : 'border-cloud-200 bg-white text-ink-600 hover:border-brand-200 hover:text-ink-950'
            }`}
          >
            {tab.labelHr}
          </button>
        ))}
      </div>

      <section
        aria-label={`Ljestvica: ${TABS.find((t) => t.id === activeTab)?.labelHr}`}
        className="overflow-hidden rounded-[2rem] border-2 border-cloud-200 bg-white shadow-card"
      >
        {isLoading ? (
          <p className="p-8 text-center font-bold text-ink-600" role="status">
            Učitavamo ljestvicu…
          </p>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-bold text-rose-700">Greška pri učitavanju: {error}</p>
            <button type="button" onClick={refresh} className="game-button game-button-secondary mt-4 px-5 py-2.5">
              Pokušaj ponovno
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-4xl" aria-hidden="true">🌱</p>
            <p className="mt-3 font-bold text-ink-600">
              Još nema rezultata za ovu temu. Odigraj Score Strike prijavljen
              i budi prvi na ljestvici!
            </p>
          </div>
        ) : (
          <ol className="divide-y-2 divide-cloud-100">
            {entries.map((entry, index) => (
              <li
                key={`${entry.displayName}-${index}`}
                className={`flex items-center gap-4 px-5 py-3.5 ${index < 3 ? 'bg-amber-50/60' : ''}`}
              >
                <span className="w-9 shrink-0 text-center text-lg font-black tabular-nums text-ink-600" aria-hidden="true">
                  {MEDALS[index] ?? index + 1}
                </span>
                <span className="sr-only">{index + 1}. mjesto:</span>
                <span className="min-w-0 flex-1 truncate font-black text-ink-950">
                  {entry.displayName}
                </span>
                <span className="shrink-0 font-black tabular-nums text-amber-700">
                  {entry.bestScore.toLocaleString('hr-HR')}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {!profile.isSignedIn && (
        <p className="text-center text-sm font-bold text-ink-600">
          Prijavi se (gumb u zaglavlju) da se tvoji rezultati pojave na ljestvici.
        </p>
      )}
    </div>
  );
}

// Profil se prosljeđuje odozgo (a ne zove useProfile ponovno) da se izbjegne
// drugi, identičan dohvat istog reda iz Supabasea pri svakom mountu stranice.
function DisplayNameEditor({ profile }: { profile: ReturnType<typeof useProfile> }) {
  const { displayName, isLoading, updateDisplayName } = profile;
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const value = draft ?? displayName ?? '';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setErrorMessage('');
    try {
      await updateDisplayName(value);
      setStatus('saved');
      setDraft(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Spremanje nije uspjelo.');
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-md flex-wrap items-end justify-center gap-3 rounded-2xl border-2 border-cloud-200 bg-cloud-50 p-4"
    >
      <label className="min-w-0 flex-1 text-left">
        <span className="block text-xs font-black uppercase tracking-wider text-ink-600">
          Tvoje ime na ljestvici
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            setStatus('idle');
          }}
          minLength={DISPLAY_NAME_MIN}
          maxLength={DISPLAY_NAME_MAX}
          disabled={isLoading}
          placeholder={isLoading ? 'Učitavanje…' : 'npr. SQLMajstor'}
          className="mt-1.5 w-full rounded-xl border-2 border-cloud-200 bg-white px-3 py-2 font-bold text-ink-950 outline-none transition focus:border-brand-300"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'saving' || isLoading || value.trim() === (displayName ?? '')}
        className="game-button game-button-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'saving' ? 'Spremam…' : 'Spremi'}
      </button>
      {status === 'saved' && (
        <p className="w-full text-center text-sm font-bold text-brand-700" role="status">
          Ime spremljeno! ✓
        </p>
      )}
      {status === 'error' && (
        <p className="w-full text-center text-sm font-bold text-rose-700" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default LeaderboardPage;
