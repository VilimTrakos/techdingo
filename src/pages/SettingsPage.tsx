import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../hooks/useAuth';
import { resolveHearts } from '../state/hearts';

/**
 * Postavke. Zasad ima jednu radnju, ali onu koju korisnik nije imao nikako:
 * brisanje vlastitog napretka. Tko je vježbao na tuđem računalu ili želi
 * ispočetka do sad nije imao izlaz osim ručnog čišćenja localStoragea.
 */
export function SettingsPage() {
  const { state, resetProgress } = useProgress();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const hearts = resolveHearts(state.hearts).balance;
  const lessonsDone = Object.values(state.lessons).filter((l) => l.passCount > 0).length;

  const handleReset = () => {
    resetProgress();
    setConfirming(false);
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <header className="rounded-[2rem] border-2 border-cloud-200 bg-white px-6 py-8 text-center shadow-[0_6px_0_#e2e9df] sm:px-10">
        <p className="text-5xl" aria-hidden="true">⚙️</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-ink-950 sm:text-5xl">
          Postavke
        </h1>
      </header>

      <section className="rounded-[1.75rem] border-2 border-cloud-200 bg-white p-6 shadow-[0_4px_0_#e2e9df] sm:p-8">
        <h2 className="text-xl font-black text-ink-950 sm:text-2xl">Tvoj napredak</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['XP', state.xpTotal],
            ['Niz', state.streak.current],
            ['Cjelina', lessonsDone],
            ['Srca', `${hearts}/5`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border-2 border-cloud-200 bg-cloud-50 px-3 py-3 text-center">
              <dt className="text-xs font-black uppercase tracking-wider text-ink-600">{label}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-ink-950">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-[1.75rem] border-2 border-rose-200 bg-white p-6 shadow-[0_4px_0_#fecdd3] sm:p-8">
        <h2 className="text-xl font-black text-ink-950 sm:text-2xl">Obriši napredak</h2>

        {done ? (
          <p role="status" className="mt-3 rounded-xl bg-brand-50 px-4 py-3 font-bold text-brand-800">
            Napredak je obrisan. Krećeš ispočetka.
          </p>
        ) : (
          <>
            <p className="mt-3 font-medium leading-7 text-ink-600">
              Vraća XP, niz, rezultate i prođene cjeline na nulu.{' '}
              {user ? (
                <strong className="text-rose-800">
                  Kako si prijavljen, briše se i spremljeno u oblaku — na svim tvojim uređajima.
                </strong>
              ) : (
                'Briše se samo na ovom uređaju.'
              )}{' '}
              Srca ostaju kakva jesu; ona su vezana uz uređaj, ne uz napredak.
            </p>

            {confirming ? (
              <div className="mt-5 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
                <p className="font-black text-rose-900">Sigurno? Ovo se ne može poništiti.</p>
                <div className="mt-4 flex flex-col gap-3 min-[440px]:flex-row">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-12 rounded-2xl border-2 border-rose-800 bg-rose-600 px-5 font-black text-white shadow-[0_4px_0_#9f1239] transition hover:bg-rose-700 active:translate-y-1"
                  >
                    Da, obriši napredak
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="game-button min-h-12 px-5"
                  >
                    Odustani
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-5 min-h-12 rounded-2xl border-2 border-rose-300 bg-white px-5 font-black text-rose-700 shadow-[0_4px_0_#fecdd3] transition hover:bg-rose-50 active:translate-y-1"
              >
                Obriši napredak
              </button>
            )}
          </>
        )}
      </section>

      <section className="rounded-[1.75rem] border-2 border-cloud-200 bg-white p-6 shadow-[0_4px_0_#e2e9df] sm:p-8">
        <h2 className="text-xl font-black text-ink-950 sm:text-2xl">Račun i podaci</h2>
        <p className="mt-3 font-medium leading-7 text-ink-600">
          Što se sprema i gdje piše na stranici o{' '}
          <Link to="/privatnost" className="font-bold text-brand-700 underline">privatnosti</Link>.
          {user
            ? ' Cijeli račun brišeš u panelu računa gore desno.'
            : ' Bez prijave ništa ne napušta ovaj preglednik.'}
        </p>
      </section>
    </div>
  );
}

export default SettingsPage;
