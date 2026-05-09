import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ontology Flow',
  description: 'Warm editorial ontology workspace for workflow, owner, and decision management'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
