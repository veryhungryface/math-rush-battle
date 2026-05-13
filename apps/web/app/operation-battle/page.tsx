import type { Metadata } from 'next';
import OperationBattleClient from './OperationBattleClient';

export const metadata: Metadata = {
  title: '말랑 연산 배틀',
  description: '전자칠판 앞 2인 연산 배틀 게임'
};

export default function OperationBattlePage() {
  return <OperationBattleClient />;
}
