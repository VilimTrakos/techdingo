import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const guideMarkSrc = `${import.meta.env.BASE_URL}tech-hedgehog.webp`;

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center py-10 text-center">
      <section className="relative isolate w-full overflow-hidden rounded-[2.25rem] border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-brand-50 px-6 py-10 shadow-[0_7px_0_#d69e18,0_20px_50px_rgba(23,32,42,0.08)] sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="absolute -left-16 -top-20 -z-10 size-56 rounded-full bg-brand-200/65 blur-3xl"
        />
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-800">
          Greška 404
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-6 grid size-40 rotate-[-3deg] place-items-center overflow-hidden rounded-[2.5rem] border-[3px] border-ink-950 bg-white shadow-[0_7px_0_#17202a] sm:size-48"
        >
          <img src={guideMarkSrc} alt="" className="size-[92%] object-contain" />
        </div>

        <h1 className="mt-8 text-4xl font-black tracking-tight text-ink-950 sm:text-5xl">
          Ova staza ne postoji
        </h1>
        <p className="mx-auto mt-4 max-w-lg font-bold leading-7 text-ink-600">
          Izgleda da si skrenuo s karte učenja. Vrati se na početnu i odaberi
          lekciju ili Score Strike izazov.
        </p>
        <Link to="/" className="game-button game-button-primary mt-7 px-7">
          <span aria-hidden="true">←</span> Povratak na početnu
        </Link>
      </section>
    </div>
  );
}

export default NotFoundPage;
