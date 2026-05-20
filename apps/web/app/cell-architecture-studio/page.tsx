import type { Metadata } from 'next';
import CellArchitectureStudioClient from './CellArchitectureStudioClient';

export const metadata: Metadata = {
  title: 'Cell Architecture Studio',
  description: '세포와 소기관을 탐색하는 3D 학습 스튜디오'
};

export default function CellArchitectureStudioPage() {
  return <CellArchitectureStudioClient />;
}
