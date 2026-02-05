import { create } from 'zustand';
import type {
  RoomInfo,
  PlayerInfo,
  GameState,
  RoleAssignment,
  HintDisplay,
  GuessResult,
  RoundSummary,
  GameResult,
  PlayerRole,
} from '@guest-word/shared';

interface GameStore {
  // Room state
  room: RoomInfo | null;
  myPlayerId: string | null;
  myPlayerName: string | null;

  // Game state
  gameState: GameState | null;
  roleAssignment: RoleAssignment | null;
  mainWord: string | null; // Only for non-guessers
  hints: HintDisplay[];
  guesses: GuessResult[];
  roundSummary: RoundSummary | null;
  gameResult: GameResult | null;

  // Derived state
  isHost: boolean;
  myRole: PlayerRole | null;
  isMyTurn: boolean;

  // Actions
  setRoom: (room: RoomInfo | null) => void;
  setMyPlayer: (id: string, name: string) => void;
  updatePlayer: (player: PlayerInfo) => void;
  removePlayer: (playerId: string) => void;
  setGameState: (state: GameState) => void;
  setRoleAssignment: (roles: RoleAssignment) => void;
  setMainWord: (word: string) => void;
  addHint: (hint: HintDisplay) => void;
  addGuess: (result: GuessResult) => void;
  setRoundSummary: (summary: RoundSummary | null) => void;
  setGameResult: (result: GameResult) => void;
  reset: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  room: null,
  myPlayerId: null,
  myPlayerName: null,
  gameState: null,
  roleAssignment: null,
  mainWord: null,
  hints: [],
  guesses: [],
  roundSummary: null,
  gameResult: null,
  isHost: false,
  myRole: null,
  isMyTurn: false,

  // Actions
  setRoom: (room) => {
    const { myPlayerId } = get();
    const isHost = room?.players.find((p) => p.id === myPlayerId)?.isHost ?? false;
    set({ room, isHost });
  },

  setMyPlayer: (id, name) => {
    set({ myPlayerId: id, myPlayerName: name });
  },

  updatePlayer: (player) => {
    const { room } = get();
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === player.id);
    if (playerIndex === -1) {
      // New player
      set({
        room: {
          ...room,
          players: [...room.players, player],
        },
      });
    } else {
      // Update existing
      const updatedPlayers = [...room.players];
      updatedPlayers[playerIndex] = player;
      set({
        room: {
          ...room,
          players: updatedPlayers,
        },
      });
    }
  },

  removePlayer: (playerId) => {
    const { room } = get();
    if (!room) return;

    set({
      room: {
        ...room,
        players: room.players.filter((p) => p.id !== playerId),
      },
    });
  },

  setGameState: (state) => {
    const { myPlayerId, roleAssignment } = get();

    const myRole = roleAssignment?.myRole ?? null;
    const isMyTurn =
      (state.phase === 'WORD_SELECTION' && myRole === 'WORD_SETTER') ||
      (state.phase === 'HINT_PHASE' && myRole === 'HINTER') ||
      (state.phase === 'GUESS_PHASE' && myRole === 'GUESSER');

    // 新回合開始時重置相關狀態
    if (state.phase === 'WORD_SELECTION') {
      set({
        gameState: state,
        hints: state.hints,
        guesses: [],
        mainWord: null,
        isMyTurn,
      });
    } else {
      set({
        gameState: state,
        hints: state.hints,
        isMyTurn,
      });
    }
  },

  setRoleAssignment: (roles) => {
    set({
      roleAssignment: roles,
      myRole: roles.myRole,
    });
  },

  setMainWord: (word) => {
    set({ mainWord: word });
  },

  addHint: (hint) => {
    set((state) => ({
      hints: [...state.hints, hint],
    }));
  },

  addGuess: (result) => {
    set((state) => ({
      guesses: [...state.guesses, result],
    }));
  },

  setRoundSummary: (summary) => {
    set({ roundSummary: summary });
  },

  setGameResult: (result) => {
    set({ gameResult: result });
  },

  reset: () => {
    set({
      room: null,
      myPlayerId: null,
      myPlayerName: null,
      gameState: null,
      roleAssignment: null,
      mainWord: null,
      hints: [],
      guesses: [],
      roundSummary: null,
      gameResult: null,
      isHost: false,
      myRole: null,
      isMyTurn: false,
    });
  },

  resetGame: () => {
    set({
      gameState: null,
      roleAssignment: null,
      mainWord: null,
      hints: [],
      guesses: [],
      roundSummary: null,
      gameResult: null,
      myRole: null,
      isMyTurn: false,
    });
  },
}));
