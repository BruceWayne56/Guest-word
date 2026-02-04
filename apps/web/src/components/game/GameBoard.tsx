'use client';

import { useGameStore } from '@/stores/gameStore';
import { Card } from '@/components/ui/Card';
import { RoleDisplay } from './RoleDisplay';
import { WordSelector } from './WordSelector';
import { HintInput } from './HintInput';
import { GuessInput } from './GuessInput';
import { HintList } from './HintList';
import { cn } from '@/lib/utils';

export function GameBoard() {
  const { gameState, roleAssignment, myRole, mainWord, hints, room } =
    useGameStore();

  if (!gameState || !roleAssignment) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8">載入中...</Card>
      </main>
    );
  }

  const { phase, currentRound, maxRounds } = gameState;

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">房間</span>
              <span className="ml-2 font-mono font-bold">{room?.code}</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">回合</span>
              <span className="ml-2 font-bold">
                {currentRound} / {maxRounds}
              </span>
            </div>
            <RoleDisplay role={myRole} />
          </div>
        </Card>

        {/* Main Word (for non-guessers) */}
        {mainWord && myRole !== 'GUESSER' && (
          <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className="text-sm text-emerald-600 mb-2">主字</p>
            <p className="text-6xl font-bold text-emerald-700">{mainWord}</p>
          </Card>
        )}

        {/* Phase-specific content */}
        <Card className="p-6">
          {phase === 'WORD_SELECTION' && myRole === 'WORD_SETTER' && (
            <WordSelector />
          )}

          {phase === 'WORD_SELECTION' && myRole !== 'WORD_SETTER' && (
            <div className="text-center py-8">
              <p className="text-gray-500">等待出題者選擇主字...</p>
              <p className="text-sm text-gray-400 mt-2">
                出題者：{roleAssignment.wordSetterName}
              </p>
            </div>
          )}

          {phase === 'HINT_PHASE' && (
            <div className="space-y-6">
              {myRole === 'HINTER' && <HintInput />}
              {myRole === 'GUESSER' && (
                <div className="text-center py-4">
                  <p className="text-gray-500">等待提示者給出提示...</p>
                </div>
              )}
              {myRole === 'WORD_SETTER' && (
                <div className="text-center py-4">
                  <p className="text-gray-500">等待提示者給出提示...</p>
                </div>
              )}
              <HintList hints={hints} />
            </div>
          )}

          {phase === 'GUESS_PHASE' && (
            <div className="space-y-6">
              <HintList hints={hints} />
              {myRole === 'GUESSER' && <GuessInput />}
              {myRole !== 'GUESSER' && (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    等待 {roleAssignment.guesserName} 猜字...
                  </p>
                </div>
              )}
            </div>
          )}

          {phase === 'ROUND_END' && (
            <div className="text-center py-8">
              <p className="text-xl">回合結束</p>
            </div>
          )}
        </Card>

        {/* Players & Scores */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">分數</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {room?.players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  'p-2 rounded text-center',
                  player.role === 'GUESSER' && 'role-guesser border',
                  player.role === 'WORD_SETTER' && 'role-setter border',
                  player.role === 'HINTER' && 'role-hinter border'
                )}
              >
                <p className="font-medium text-sm">{player.name}</p>
                <p className="text-lg font-bold">
                  {gameState.scores[player.id] || 0}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
