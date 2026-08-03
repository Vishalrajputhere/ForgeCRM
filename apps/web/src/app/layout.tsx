import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';

import './globals.css';

// ── Fonts ─────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'ForgeCRM',
    template: '%s | ForgeCRM',
  },
  description:
    'Enterprise-grade multi-tenant CRM platform for modern businesses. Manage contacts, leads, deals, and pipelines with AI-assisted productivity.',
  keywords: ['CRM', 'sales', 'contacts', 'leads', 'deals', 'pipeline', 'enterprise'],
  authors: [{ name: 'ForgeCRM Team' }],
  robots: {
    index: false, // CRM is private application — no indexing
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// ── Root Layout ───────────────────────────────────────────────────────────────

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning // Required for next-themes
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
