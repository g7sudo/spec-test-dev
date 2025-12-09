import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

/**
 * Root layout - wraps the entire application
 * Sets up providers and global styles
 */

export const metadata: Metadata = {
  title: 'SPEC TESTING',
  description: 'SPEC TESTING',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-50">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
