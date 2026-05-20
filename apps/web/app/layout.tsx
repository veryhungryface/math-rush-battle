import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cell Architecture Studio',
  description: '교육용 3D 생명과학 탐색 스튜디오'
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
