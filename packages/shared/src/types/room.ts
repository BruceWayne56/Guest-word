import type { Player, PlayerInfo } from './player.js';

export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export interface GameSettings {
  rounds: number;
  hintTimeLimit: number;
  guessTimeLimit: number;
  maxGuesses: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  minPlayers: number;
  status: RoomStatus;
  isPrivate: boolean;
  password?: string;
  settings: GameSettings;
  createdAt: number;
  lastActivityAt: number;
}

export interface RoomInfo {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: PlayerInfo[];
  maxPlayers: number;
  minPlayers: number;
  status: RoomStatus;
  isPrivate: boolean;
  settings: GameSettings;
}

export interface CreateRoomOptions {
  hostName: string;
  name?: string;
  maxPlayers?: number;
  isPrivate?: boolean;
  password?: string;
  rounds?: number;
  hintTimeLimit?: number;
  guessTimeLimit?: number;
  maxGuesses?: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  rounds: 5,
  hintTimeLimit: 60,
  guessTimeLimit: 120,
  maxGuesses: 3,
};
