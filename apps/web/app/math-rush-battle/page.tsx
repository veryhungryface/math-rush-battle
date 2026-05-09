import type { Metadata } from 'next';
import MathRushBattleClient from './MathRushBattleClient';

export const metadata: Metadata = {
  title: '수학 러시 배틀',
  description: '전자칠판용 수학 러너 디펜스 배틀 프로토타입'
};

export default function MathRushBattlePage() {
  return <MathRushBattleClient />;
}
