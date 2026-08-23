import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QuestionsLoadError } from './QuestionsLoadError';

/**
 * Ova poruka postoji da pali dohvat pitanja ne završi vječnim spinnerom.
 * Ako gumb za ponovni pokušaj ne zove natrag, korisnik je zapeo isto kao prije.
 */
function renderError(onRetry = vi.fn()) {
  render(
    <MemoryRouter>
      <QuestionsLoadError onRetry={onRetry} />
    </MemoryRouter>,
  );
  return { onRetry, user: userEvent.setup() };
}

describe('QuestionsLoadError', () => {
  it('javlja se čitačima ekrana kao upozorenje, ne kao tihi tekst', () => {
    renderError();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('kaže da napredak nije izgubljen', () => {
    renderError();
    expect(screen.getByText(/napredak je spremljen i nije izgubljen/i)).toBeInTheDocument();
  });

  it('gumb za ponovni pokušaj stvarno zove natrag', async () => {
    const { onRetry, user } = renderError();
    await user.click(screen.getByRole('button', { name: 'Pokušaj ponovno' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('nudi i izlaz na početnu, da korisnik ne ostane zaglavljen', () => {
    renderError();
    expect(screen.getByRole('link', { name: /Natrag na teme/ })).toHaveAttribute('href', '/');
  });
});
