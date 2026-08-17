import { NavLink, Outlet } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { StreakBadge } from './StreakBadge';
import { XPBadge } from './XPBadge';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-xl border-2 px-3 py-2 text-sm font-black transition-all duration-150 active:translate-y-0.5',
    isActive
      ? 'border-brand-300 bg-brand-100 text-brand-700 shadow-[0_2px_0_#82df91]'
      : 'border-transparent text-ink-600 hover:border-cloud-200 hover:bg-cloud-100 hover:text-ink-950',
  ].join(' ');

export function AppShell() {
  const { state } = useProgress();
  const markSrc = `${import.meta.env.BASE_URL}tech-hedgehog.webp`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-cloud-200/90 bg-white/92 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6">
          <NavLink
            to="/"
            className="group flex min-w-0 items-center gap-2 rounded-xl"
            aria-label="TechDingo početna"
          >
            <span
              className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-brand-700 bg-brand-100 shadow-[0_3px_0_#1e7430] transition-transform group-hover:-translate-y-0.5"
              aria-hidden="true"
            >
              <img src={markSrc} alt="" className="size-full object-contain p-0.5" />
            </span>
            <span className="hidden text-xl font-black tracking-tight text-ink-950 min-[520px]:inline">
              Tech<span className="text-brand-600">Dingo</span>
            </span>
          </NavLink>

          <nav className="ml-auto flex items-center gap-0.5 sm:gap-1" aria-label="Glavna navigacija">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t-2 border-cloud-200 bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm font-bold text-ink-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Jedan korak dnevno. Velik skok na intervjuu.</p>
          <p>
            <span aria-hidden="true">🔥</span> Serija {state.streak.current} · {state.xpTotal} XP
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
