import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Mumbai Startups Map',
  description: 'An interactive map of the Mumbai startup ecosystem.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
