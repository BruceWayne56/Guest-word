export type PlayerRole = 'GUESSER' | 'WORD_SETTER' | 'HINTER' | 'SPECTATOR';

export interface Player {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  role: PlayerRole;
  score: number;
  joinedAt: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  role: PlayerRole;
  score: number;
}

export function toPlayerInfo(player: Player): PlayerInfo {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    isReady: player.isReady,
    isOnline: player.isOnline,
    role: player.role,
    score: player.score,
  };
}
