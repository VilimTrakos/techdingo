import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

/**
 * Čuva prelamanje zaglavlja na mobitelu.
 *
 * Navigacija nosi `w-full` i `order-3` da na uskom zaslonu padne u vlastiti
 * red. Roditelj to dopušta samo ako ima `flex-wrap`. Bez njega nav ostaje u
 * istom retku i gura dokument 63px u širinu - cijela se aplikacija skrola
 * postrance na svakom telefonu. Točno to je bilo u produkciji.
 *
 * jsdom ne računa raspored, pa se provjerava sama veza između te dvije klase.
 */
function renderShell() {
  render(
    <MemoryRouter>
      <AppShell />
    </MemoryRouter>,
  );
  const nav = screen.getByRole('navigation', { name: 'Glavna navigacija' });
  return { nav, row: nav.parentElement as HTMLElement };
}

describe('AppShell zaglavlje', () => {
  it('navigacija je postavljena da se prelomi u vlastiti red', () => {
    const { nav } = renderShell();
    expect(nav.className).toContain('w-full');
    expect(nav.className).toContain('order-3');
  });

  it('redak zaglavlja dopušta prelamanje, inače nav gura stranicu u širinu', () => {
    const { nav, row } = renderShell();
    const wrapping = nav.className.includes('w-full') && nav.className.includes('order-3');
    if (wrapping) {
      expect(row.className, 'nav traži prelamanje, a roditelj ga ne dopušta').toContain('flex-wrap');
    }
  });

  it('na širokom zaslonu se vraća u jedan redak', () => {
    const { row } = renderShell();
    expect(row.className).toContain('sm:flex-nowrap');
  });

  it('podnožje vodi na privatnost i postavke', () => {
    renderShell();
    const footer = screen.getByRole('navigation', { name: 'Podnožje' });
    expect(footer.querySelector('a[href="/privatnost"]')).toBeTruthy();
    expect(footer.querySelector('a[href="/postavke"]')).toBeTruthy();
  });
});
