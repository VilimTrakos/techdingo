/**
 * Prikazuje se dok se chunk stranice dovlači (vidi lazy rute u App.tsx).
 * Namjerno je tih i bez teksta: na brzoj vezi chunk stigne za desetke
 * milisekundi, pa bi poruka "Učitavanje…" samo bljesnula.
 */
export function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Učitavanje stranice">
      <span className="size-10 animate-spin rounded-full border-4 border-cloud-200 border-t-brand-500" aria-hidden="true" />
    </div>
  );
}
