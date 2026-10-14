import type { Metadata } from 'next';
import '@/styles/globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'VANISH : Ephemeral Cloud File Sharing',
  description: 'Files that share themselves and clean up after themselves. Secure temporary cloud file sharing with automated TTL deletion, encryption, and zero digital residue.',
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
      </head>
      <body>
        <Header />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
