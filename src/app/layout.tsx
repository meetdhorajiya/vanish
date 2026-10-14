import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import '@/styles/globals.css';
import Header from '@/components/Header';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'VANISH : Zero-Knowledge Ephemeral Cloud File Sharing',
  description: 'Files that share themselves and genuinely clean up after themselves. Secure temporary cloud file sharing with automated TTL deletion, AES-256 client encryption, and zero digital residue.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <ToastProvider>
          <Suspense fallback={<div style={{ height: '60px' }} />}>
            <Header />
          </Suspense>
          <main className="container">
            <Suspense fallback={<div style={{ padding: '60px 0', textAlign: 'center' }}>Loading Vanish...</div>}>
              {children}
            </Suspense>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
