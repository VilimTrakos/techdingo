import { NavLink, Outlet } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { StreakBadge } from './StreakBadge';
import { XPBadge } from './XPBadge';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-xl px-3 py-2 text-sm font-extrabold transition-colors',
    isActive
      ? 'bg-brand-100 text-brand-700'
      : 'text-ink-600 hover:bg-cloud-100 hover:text-ink-950',
  ].join(' ');

export function AppShell() {
  const { state } = useProgress();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-cloud-200/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <NavLink
            to="/"
            className="group flex min-w-0 items-center gap-2 rounded-xl"
            aria-label="TechDingo početna"
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-brand-700 bg-brand-500 text-xl shadow-[0_3px_0_#1e7430] transition-transform group-hover:-translate-y-0.5"
              aria-hidden="true"
            >
              🐕
            </span>
            <span className="hidden text-xl font-black tracking-tight text-ink-950 min-[390px]:inline">
              Tech<span className="text-brand-600">Dingo</span>
            </span>
          </NavLink>

          <nav className="ml-auto flex items-center gap-1" aria-label="Glavna navigacija">
            <NavLink to="/" end className={navLinkClass}>
              Uči
            </NavLink>
            <NavLink to="/stats" className={navLinkClass}>
              Statistika
            </NavLink>
          </nav>

          <div className="ml-1 hidden items-center gap-2 sm:flex" aria-label="Tvoj napredak">
            <StreakBadge streak={state.streak.current} />
            <XPBadge xp={state.xpTotal} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-cloud-200 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-ink-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Vježbaj malo. Napreduj svaki dan.</p>
          <p>
            <span aria-hidden="true">🔥</span> Serija {state.streak.current} · {state.xpTotal} XP
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
