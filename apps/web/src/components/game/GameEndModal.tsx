'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function GameEndModal() {
  const router = useRouter();
  const { gameResult, room, resetGame } = useGameStore();

  if (!gameResult) return null;

  const sortedScores = Object.entries(gameResult.finalScores)
    .map(([playerId, score]) => ({
      playerId,
      score,
      name: room?.players.find((p) => p.id === playerId)?.name || 'Unknown',
    }))
    .sort((a, b) => b.score - a.score);

  const handlePlayAgain = () => {
    resetGame();
    // Room will handle the reset
  };

  const handleLeave = () => {
    router.push('/');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-center mb-6">遊戲結束！</h2>

        {gameResult.winner && (
          <div className="text-center mb-6">
            <p className="text-gray-500 mb-2">獲勝者</p>
            <p className="text-3xl font-bold text-amber-600">
              🏆 {gameResult.winner.name}
            </p>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-medium text-gray-500">最終排名</h3>
          <div className="space-y-2">
            {sortedScores.map((player, index) => (
              <div
                key={player.playerId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="font-bold text-primary-600">
                  {player.score} 分
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleLeave} variant="secondary" className="flex-1">
            離開
          </Button>
          <Button onClick={handlePlayAgain} className="flex-1">
            再玩一次
          </Button>
        </div>
      </Card>
    </div>
  );
}
