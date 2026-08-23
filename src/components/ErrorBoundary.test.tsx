import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * ErrorBoundary je zadnja linija obrane - bez njega svaki throw pri renderu
 * daje prazan bijeli ekran. Sam nikad nije bio testiran, pa se nije znalo
 * hvata li uopće.
 */
function Explodes(): never {
  throw new Error('pukao render');
}

function renderBoundary(children: React.ReactNode) {
  // React uvijek logira uhvaćenu grešku; bez ovoga izlaz testova je nečitljiv.
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const result = render(<ErrorBoundary>{children}</ErrorBoundary>);
  return { ...result, spy };
}

describe('ErrorBoundary', () => {
  it('propušta djecu kad sve radi', () => {
    render(<ErrorBoundary><p>sadržaj</p></ErrorBoundary>);
    expect(screen.getByText('sadržaj')).toBeInTheDocument();
  });

  it('hvata throw pri renderu umjesto bijelog ekrana', () => {
    renderBoundary(<Explodes />);
    expect(screen.getByRole('heading', { name: 'Nešto je puklo' })).toBeInTheDocument();
  });

  it('poruka je na hrvatskom i kaže da napredak nije izgubljen', () => {
    renderBoundary(<Explodes />);
    expect(screen.getByText(/napredak je spremljen i nije\s+izgubljen/i)).toBeInTheDocument();
  });

  it('nudi izlaz - gumb koji osvježava stranicu', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });
    renderBoundary(<Explodes />);
    await userEvent.click(screen.getByRole('button', { name: 'Osvježi stranicu' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('tehnički detalji nose stvarnu poruku greške, ali su sklopljeni', () => {
    renderBoundary(<Explodes />);
    expect(screen.getByText('pukao render')).toBeInTheDocument();
    expect(screen.getByRole('group')).not.toHaveAttribute('open');
  });

  it('grešku i dalje logira u konzolu, za dijagnostiku', () => {
    const { spy } = renderBoundary(<Explodes />);
    expect(spy.mock.calls.flat().join(' ')).toContain('techdingo');
  });
});
