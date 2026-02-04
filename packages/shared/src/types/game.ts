import type { Player, PlayerInfo, PlayerRole } from './player.js';

export type GamePhase =
  | 'WAITING'
  | 'ROLE_ASSIGNMENT'
  | 'WORD_SELECTION'
  | 'WORD_REVEAL'
  | 'HINT_PHASE'
  | 'GUESS_PHASE'
  | 'ROUND_END'
  | 'GAME_END';

export interface Hint {
  playerId: string;
  playerName: string;
  zhuyin: string;
  hintChar?: string;
  word?: string;
  position: 'before' | 'after';
  timestamp: number;
}

export interface HintDisplay {
  playerId: string;
  playerName: string;
  zhuyin: string;
  timestamp: number;
}

export interface Guess {
  guess: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface GameState {
  id: string;
  roomId: string;
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  guesserId: string | null;
  wordSetterId: string | null;
  hinterIds: string[];
  mainWord: string | null;
  hints: HintDisplay[];
  guesses: Guess[];
  scores: Record<string, number>;
  phaseStartTime: number;
  phaseTimeLimit: number;
}

export interface RoleAssignment {
  myRole: PlayerRole;
  guesserId: string;
  guesserName: string;
  wordSetterId: string;
  wordSetterName: string;
  hinterIds: string[];
  hinterNames: string[];
}

export interface HintSubmission {
  hintChar: string;
}

export interface HintValidation {
  valid: boolean;
  word?: string;
  position?: 'before' | 'after';
  reason?: string;
}

export interface GuessResult {
  guess: string;
  isCorrect: boolean;
  correctAnswer?: string;
  remainingGuesses: number;
}

export interface RoundSummary {
  round: number;
  mainWord: string;
  hints: Hint[];
  guesses: Guess[];
  isCorrect: boolean;
  scores: Record<string, number>;
}

export interface GameResult {
  rounds: RoundSummary[];
  finalScores: Record<string, number>;
  winner: PlayerInfo | null;
}
