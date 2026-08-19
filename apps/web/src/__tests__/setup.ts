/**
 * Vitest global test setup.
 *
 * - Imports jest-dom matchers so all test files get `toBeInTheDocument()` etc.
 * - Sets up global fetch mock to prevent unintended real HTTP calls.
 */
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up React Testing Library after each test to prevent state leaks.
afterEach(() => {
  cleanup();
});

// Global fetch stub — tests that need real fetch should mock it explicitly.
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}
