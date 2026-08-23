import { Link } from 'react-router-dom';

interface Props {
  onRetry: () => void;
}

/**
 * Pitanja se dovlače u zasebnom chunku po temi (vidi data/questionLoader.ts),
 * pa dohvat može pasti: prekinuta mreža ili stara kartica otvorena preko
 * novog deploya u kojem ta datoteka više ne postoji pod istim imenom.
 *
 * Bez ove poruke sesija bi zauvijek stajala na "Pripremamo lekciju…" - točno
 * onaj vječni spinner koji je već jednom bio bug u dohvatu profila i ljestvice.
 */
export function QuestionsLoadError({ onRetry }: Props) {
  return (
    <div
      className="mx-auto max-w-xl rounded-[2rem] border-2 border-amber-200 bg-white p-8 text-center shadow-[0_6px_0_#fde68a] sm:p-10"
      role="alert"
    >
      <p className="text-6xl" aria-hidden="true">📡</p>
      <h1 className="mt-4 text-3xl font-black text-ink-950">Pitanja nisu stigla</h1>
      <p className="mt-3 font-medium leading-7 text-ink-600">
        Nismo uspjeli dohvatiti pitanja. Provjeri internetsku vezu i pokušaj
        ponovno — tvoj napredak je spremljen i nije izgubljen.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 min-[440px]:flex-row">
        <button type="button" onClick={onRetry} className="game-button game-button-primary px-6 py-3">
          Pokušaj ponovno
        </button>
        <Link to="/" className="game-button px-6 py-3">
          Natrag na teme
        </Link>
      </div>
    </div>
  );
}
