import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Zadnja linija obrane: bez ovoga svaki throw pri renderu daje prazan bijeli
 * ekran bez ijedne poruke. Mora biti class komponenta - React nema hook
 * ekvivalent za componentDidCatch.
 *
 * Napredak je u localStorageu i preživi osvježavanje, pa je ponuda "osvježi"
 * ovdje sigurna i najčešće dovoljna.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('techdingo: neuhvaćena greška pri renderu.', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-6xl" aria-hidden="true">
          🧯
        </p>
        <h1 className="text-3xl font-black text-ink-950">Nešto je puklo</h1>
        <p className="font-medium leading-7 text-ink-600">
          Dogodila se neočekivana greška. Tvoj napredak je spremljen i nije
          izgubljen — osvježi stranicu i nastavi gdje si stao.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="game-button game-button-primary mt-2 px-6 py-3"
        >
          Osvježi stranicu
        </button>
        <details className="mt-4 w-full text-left">
          <summary className="cursor-pointer text-sm font-bold text-ink-400">
            Tehnički detalji
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-cloud-100 p-3 text-xs text-ink-600">
            {this.state.error.message}
          </pre>
        </details>
      </div>
    );
  }
}

export default ErrorBoundary;
