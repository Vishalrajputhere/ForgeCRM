'use client';

/**
 * Theme Provider
 *
 * Wraps the application with next-themes for dark/light mode support.
 * Reads system preference by default.
 *
 * Documentation: docs/04_Frontend/402_DESIGN_SYSTEM.md
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps): React.JSX.Element {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
