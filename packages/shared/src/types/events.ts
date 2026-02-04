import type { CreateRoomOptions, RoomInfo } from './room.js';
import type { PlayerInfo } from './player.js';
import type {
  GameState,
  RoleAssignment,
  HintDisplay,
  GuessResult,
  RoundSummary,
  GameResult,
  GamePhase,
} from './game.js';

export interface ServerToClientEvents {
  // Room events
  'room:created': (room: RoomInfo) => void;
  'room:joined': (data: { room: RoomInfo; player: PlayerInfo }) => void;
  'room:playerJoined': (player: PlayerInfo) => void;
  'room:playerLeft': (playerId: string) => void;
  'room:playerDisconnected': (playerId: string) => void;
  'room:playerReconnected': (playerId: string) => void;
  'room:hostChanged': (newHostId: string) => void;
  'room:updated': (room: RoomInfo) => void;
  'room:error': (error: { code: string; message: string }) => void;

  // Game events
  'game:started': (gameState: GameState) => void;
  'game:rolesAssigned': (roles: RoleAssignment) => void;
  'game:wordSelected': () => void;
  'game:wordRevealed': (word: string) => void;
  'game:phaseChanged': (phase: GamePhase) => void;
  'game:hintSubmitted': (hint: HintDisplay) => void;
  'game:hintRejected': (reason: string) => void;
  'game:guessResult': (result: GuessResult) => void;
  'game:roundEnd': (summary: RoundSummary) => void;
  'game:ended': (result: GameResult) => void;
  'game:stateSync': (state: GameState) => void;
  'game:error': (message: string) => void;
}

export interface ClientToServerEvents {
  // Room events
  'room:create': (
    options: CreateRoomOptions,
    callback: (response: { success: boolean; room?: RoomInfo; error?: string }) => void
  ) => void;
  'room:join': (
    roomCode: string,
    playerName: string,
    password: string | undefined,
    callback: (response: { success: boolean; room?: RoomInfo; player?: PlayerInfo; error?: string }) => void
  ) => void;
  'room:leave': () => void;
  'room:ready': (isReady: boolean) => void;
  'room:updateSettings': (settings: Partial<CreateRoomOptions>) => void;

  // Game events
  'game:start': () => void;
  'game:selectWord': (word: string) => void;
  'game:submitHint': (hintChar: string) => void;
  'game:guess': (guess: string) => void;
  'game:skipRound': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
  playerName: string;
  roomId: string;
}
