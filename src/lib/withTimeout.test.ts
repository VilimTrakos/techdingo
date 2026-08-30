import { describe, expect, it, vi } from 'vitest';
import { CLOUD_TIMEOUT_MS, TimeoutError, withTimeout } from './withTimeout';

/**
 * supabase-js sam ponavlja pokušaje kad poslužitelj nije dostupan. Kad je
 * projekt bio nedostupan, ljestvica je 15 sekundi stajala na "Učitavamo…"
 * prije ijedne poruke. Ovo drži da se odustaje na vrijeme.
 */
describe('withTimeout', () => {
  it('propušta vrijednost kad obećanje stigne na vrijeme', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 'test', 50)).resolves.toBe('ok');
  });

  it('propušta grešku kad obećanje padne', async () => {
    await expect(withTimeout(Promise.reject(new Error('pukло')), 'test', 50)).rejects.toThrow('pukло');
  });

  it('odustaje kad obećanje predugo traje', async () => {
    vi.useFakeTimers();
    const never = new Promise(() => {});
    const p = withTimeout(never, 'dohvat ljestvice', 8000);
    const assertion = expect(p).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(8001);
    await assertion;
    vi.useRealTimers();
  });

  it('poruka greške kaže ŠTO je isteklo, za dijagnostiku iz konzole', async () => {
    await expect(withTimeout(new Promise(() => {}), 'dohvat profila', 5)).rejects.toThrow(/dohvat profila/);
  });

  it('ne pušta timer da visi kad obećanje stigne prvo', async () => {
    // Bez clearTimeout bi svaki poziv ostavljao mjerač koji drži proces budnim.
    vi.useFakeTimers();
    const spy = vi.spyOn(globalThis, 'clearTimeout');
    await withTimeout(Promise.resolve(1), 'test', 1000);
    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('zadano čekanje je osjetno kraće od 15 s koliko je supabase-js trošio', () => {
    expect(CLOUD_TIMEOUT_MS).toBeLessThan(12000);
    expect(CLOUD_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
  });
});
