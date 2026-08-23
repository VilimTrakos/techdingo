import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Bez ovoga renderirane komponente ostaju u document.body i idući test ih
// nađe kroz getBy* - lažni prolazi i lažni "found multiple elements".
afterEach(() => {
  cleanup();
  localStorage.clear();
});
