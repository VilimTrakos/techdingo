import { describe, expect, it } from 'vitest';
import { authErrorMessageHr } from './authErrors';

describe('authErrorMessageHr', () => {
  it('prevodi najčešće Supabase greške na hrvatski', () => {
    expect(authErrorMessageHr(new Error('Invalid login credentials'))).toMatch(/Neispravan/);
    expect(authErrorMessageHr(new Error('Email not confirmed'))).toMatch(/nije potvrđen/);
    expect(authErrorMessageHr(new Error('User already registered'))).toMatch(/već postoji/);
  });

  it('hvata rate-limit poruku s promjenjivim brojem sekundi', () => {
    const err = new Error('For security purposes, you can only request this after 46 seconds');
    expect(authErrorMessageHr(err)).toMatch(/Previše pokušaja/);
  });

  it('nepoznatu grešku pretvara u generičku hrvatsku poruku, nikad sirovi engleski', () => {
    const message = authErrorMessageHr(new Error('Some brand new upstream failure'));
    expect(message).toBe('Nešto je pošlo po zlu. Pokušaj ponovno.');
    expect(message).not.toMatch(/upstream/);
  });

  it('ne puca na null/undefined', () => {
    expect(typeof authErrorMessageHr(null)).toBe('string');
    expect(typeof authErrorMessageHr(undefined)).toBe('string');
  });
});
