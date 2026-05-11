import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '수학 러시 배틀',
  description: '전자칠판용 초등 수학 러너 슈터 게임'
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
