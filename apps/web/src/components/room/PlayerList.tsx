import type { PlayerInfo } from '@guest-word/shared';
import { cn } from '@/lib/utils';

interface PlayerListProps {
  players: PlayerInfo[];
  myPlayerId: string | null;
}

export function PlayerList({ players, myPlayerId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-gray-500">
        玩家 ({players.length})
      </h2>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              player.id === myPlayerId
                ? 'bg-primary-50 border border-primary-200'
                : 'bg-gray-50'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  player.isOnline ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
              <span className="font-medium">
                {player.name}
                {player.id === myPlayerId && (
                  <span className="text-primary-600 text-sm ml-1">(你)</span>
                )}
              </span>
              {player.isHost && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                  房主
                </span>
              )}
            </div>
            <div>
              {player.isReady ? (
                <span className="text-green-600 text-sm">已準備</span>
              ) : (
                <span className="text-gray-400 text-sm">等待中</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
