import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center py-10 text-center">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-indigo-600">
          Greška 404
        </p>
        <p
          className="mt-4 text-7xl drop-shadow-sm sm:text-8xl"
          aria-hidden="true"
        >
          🦕
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Ova staza ne postoji
        </h1>
        <p className="mx-auto mt-4 max-w-lg font-medium leading-7 text-slate-600">
          Izgleda da je TechDingo zalutao. Vrati se na početnu i odaberi
          lekciju ili Score Strike izazov.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Povratak na početnu
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
