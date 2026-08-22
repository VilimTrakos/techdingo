import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { msUntilNextHeart } from '../state/hearts';
import { useProgress } from '../hooks/useProgress';

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}:${String(s).padStart(2, '0')}`;
}

const AD_DURATION_S = 5;

/**
 * Ekran "nemaš srca" (tvrdi gate za lekcije). Nudi: čekanje regeneracije
 * (live odbrojavanje), gledanje reklame za +1 srce (STUB - lažna reklama od
 * 5 s; pravi ad SDK kasnije samo zamijeni sadržaj modala), Score Strike koji
 * ne troši srca, i testni refill (dok pravi ad network ne postoji).
 */
export function HeartsGate({ scoreStrikeHref }: { scoreStrikeHref: string }) {
  const { state, grantAdHeart, refillHearts, syncHearts } = useProgress();
  const [now, setNow] = useState(() => new Date());
  const [adSecondsLeft, setAdSecondsLeft] = useState<number | null>(null);

  // Živo odbrojavanje + materijalizacija regeneracije kad istekne.
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      syncHearts();
    }, 1000);
    return () => clearInterval(interval);
  }, [syncHearts]);

  // Stub reklame: odbrojavanje pa nagrada.
  useEffect(() => {
    if (adSecondsLeft === null) return;
    if (adSecondsLeft <= 0) {
      setAdSecondsLeft(null);
      grantAdHeart();
      return;
    }
    const timeout = setTimeout(() => setAdSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [adSecondsLeft, grantAdHeart]);

  const untilNext = msUntilNextHeart(state.hearts, now);

  return (
    <div className="hero-stage relative isolate mx-auto max-w-xl overflow-hidden rounded-[2.5rem] border-[3px] border-rose-300 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-7 text-center shadow-[0_8px_0_#fda4af,0_22px_50px_rgba(136,19,55,0.12)] sm:p-11">
      <div className="absolute -right-14 -top-16 -z-10 size-44 rounded-full bg-rose-200/60 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 -z-10 size-48 rounded-full bg-amber-200/60 blur-2xl" aria-hidden="true" />
      <div className="mx-auto grid size-24 place-items-center rounded-[2rem] border-[3px] border-rose-700 bg-white text-6xl shadow-[0_7px_0_#be123c]" aria-hidden="true">
        💔
      </div>
      <h1 className="mt-4 text-3xl font-black text-ink-950">Nemaš više srca!</h1>
      <p className="mt-3 font-medium leading-7 text-ink-600">
        Srca se obnavljaju s vremenom — jedno svaka 4 sata. U međuvremenu možeš
        pogledati reklamu za novo srce ili vježbati Score Strike (ne troši srca).
      </p>

      <div className="mt-5 flex justify-center gap-1 text-3xl text-slate-300" aria-label="Nula od pet srca">
        {Array.from({ length: 5 }, (_, index) => <span key={index}>♡</span>)}
      </div>

      {untilNext !== null && (
        <p className="mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-cloud-200 bg-cloud-50 px-4 py-2 font-black text-ink-800">
          <span aria-hidden="true">⏱</span> Sljedeće srce za{' '}
          <span className="tabular-nums text-rose-600">{formatCountdown(untilNext)}</span>
        </p>
      )}

      <div className="mt-7 grid gap-3">
        <button
          type="button"
          onClick={() => setAdSecondsLeft(AD_DURATION_S)}
          disabled={adSecondsLeft !== null}
          className="game-button game-button-primary px-6 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">📺</span> Gledaj reklamu (+1 ♥)
        </button>
        <Link to={scoreStrikeHref} className="game-button game-button-secondary px-6 py-3.5">
          <span aria-hidden="true">⚡</span> Igraj Score Strike (besplatno)
        </Link>
        <button
          type="button"
          onClick={refillHearts}
          className="mx-auto mt-1 text-xs font-bold text-ink-400 underline decoration-dotted underline-offset-4 hover:text-ink-600"
        >
          [test] Napuni srca odmah
        </button>
      </div>

      {adSecondsLeft !== null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/85 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Reklama u tijeku"
        >
          <div className="w-full max-w-md animate-pop-in rounded-[2rem] border-4 border-amber-400 bg-gradient-to-b from-white to-amber-50 p-8 text-center shadow-[0_9px_0_#b45309,0_30px_80px_rgba(0,0,0,0.35)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
              Reklama · demo
            </p>
            <p className="mt-4 text-6xl" aria-hidden="true">
              📺
            </p>
            <p className="mt-4 font-bold text-ink-800">
              Ovdje će jednog dana biti prava reklama.
              <br />
              Hvala što podržavaš TechDingo!
            </p>
            <p className="mt-6 text-4xl font-black tabular-nums text-amber-600" aria-live="polite">
              {adSecondsLeft}
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-amber-100" aria-hidden="true">
              <div
                className="h-full rounded-full bg-amber-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${((AD_DURATION_S - adSecondsLeft) / AD_DURATION_S) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeartsGate;
