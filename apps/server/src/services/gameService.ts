import { nanoid } from 'nanoid';
import type {
  Player,
  Room,
  GameState,
  GamePhase,
  Hint,
  HintDisplay,
  Guess,
  RoleAssignment,
  GuessResult,
  RoundSummary,
  GameResult,
  HintValidation,
  PlayerInfo,
} from '@guest-word/shared';

interface Game {
  id: string;
  roomId: string;
  phase: GamePhase;
  currentRound: number;
  maxRounds: number;
  players: Player[];
  guesser: Player | null;
  wordSetter: Player | null;
  hinters: Player[];
  mainWord: string | null;
  hints: Hint[];
  guesses: Guess[];
  scores: Record<string, number>;
  phaseStartTime: number;
  phaseTimeLimit: number;
  roundHistory: RoundSummary[];
}

export class GameService {
  private games: Map<string, Game> = new Map();
  private wordValidator: ((mainChar: string, hintChar: string) => HintValidation) | null = null;
  private zhuyinConverter: ((char: string) => string) | null = null;

  setWordValidator(validator: (mainChar: string, hintChar: string) => HintValidation): void {
    this.wordValidator = validator;
  }

  setZhuyinConverter(converter: (char: string) => string): void {
    this.zhuyinConverter = converter;
  }

  createGame(room: Room): Game {
    if (room.players.length < 3) {
      throw new GameError('INSUFFICIENT_PLAYERS', '至少需要 3 名玩家');
    }

    const scores: Record<string, number> = {};
    room.players.forEach((p) => {
      scores[p.id] = 0;
    });

    const game: Game = {
      id: nanoid(10),
      roomId: room.id,
      phase: 'ROLE_ASSIGNMENT',
      currentRound: 1,
      maxRounds: room.settings.rounds,
      players: [...room.players],
      guesser: null,
      wordSetter: null,
      hinters: [],
      mainWord: null,
      hints: [],
      guesses: [],
      scores,
      phaseStartTime: Date.now(),
      phaseTimeLimit: 0,
      roundHistory: [],
    };

    this.assignRoles(game);
    this.games.set(room.id, game);

    return game;
  }

  private assignRoles(game: Game): void {
    const shuffled = [...game.players].sort(() => Math.random() - 0.5);

    game.guesser = shuffled[0];
    game.wordSetter = shuffled[1];
    game.hinters = shuffled.slice(2);

    game.guesser.role = 'GUESSER';
    game.wordSetter.role = 'WORD_SETTER';
    game.hinters.forEach((p) => (p.role = 'HINTER'));
  }

  getRoleAssignment(game: Game, playerId: string): RoleAssignment {
    const player = game.players.find((p) => p.id === playerId);
    return {
      myRole: player?.role || 'SPECTATOR',
      guesserId: game.guesser?.id || '',
      guesserName: game.guesser?.name || '',
      wordSetterId: game.wordSetter?.id || '',
      wordSetterName: game.wordSetter?.name || '',
      hinterIds: game.hinters.map((h) => h.id),
      hinterNames: game.hinters.map((h) => h.name),
    };
  }

  setMainWord(roomId: string, word: string, setterId: string): void {
    const game = this.getGame(roomId);

    if (word.length !== 1) {
      throw new GameError('INVALID_WORD', '主字必須是單一個字');
    }

    if (game.wordSetter?.id !== setterId) {
      throw new GameError('INVALID_ROLE', '只有出題者可以選字');
    }

    game.mainWord = word;
    game.phase = 'WORD_REVEAL';
    game.phaseStartTime = Date.now();
  }

  startHintPhase(roomId: string, timeLimit: number): void {
    const game = this.getGame(roomId);
    game.phase = 'HINT_PHASE';
    game.phaseStartTime = Date.now();
    game.phaseTimeLimit = timeLimit;
  }

  submitHint(
    roomId: string,
    playerId: string,
    hintChar: string
  ): { success: boolean; hint?: HintDisplay; reason?: string } {
    const game = this.getGame(roomId);
    const player = game.players.find((p) => p.id === playerId);

    if (!player || player.role !== 'HINTER') {
      return { success: false, reason: '只有提示者可以提交提示' };
    }

    if (game.hints.some((h) => h.playerId === playerId)) {
      return { success: false, reason: '你已經提交過提示了' };
    }

    if (hintChar.length !== 1) {
      return { success: false, reason: '提示必須是單一個字' };
    }

    if (hintChar === game.mainWord) {
      return { success: false, reason: '不能直接提示主字' };
    }

    // Validate word combination
    let validation: HintValidation = { valid: true, position: 'before' };
    if (this.wordValidator && game.mainWord) {
      validation = this.wordValidator(game.mainWord, hintChar);
      if (!validation.valid) {
        return { success: false, reason: validation.reason || '無法組成有效的詞' };
      }
    }

    // Convert to zhuyin
    let zhuyin = hintChar;
    if (this.zhuyinConverter) {
      try {
        zhuyin = this.zhuyinConverter(hintChar);
      } catch {
        zhuyin = hintChar;
      }
    }

    const hint: Hint = {
      playerId,
      playerName: player.name,
      zhuyin,
      hintChar,
      word: validation.word,
      position: validation.position || 'before',
      timestamp: Date.now(),
    };

    game.hints.push(hint);

    const hintDisplay: HintDisplay = {
      playerId,
      playerName: player.name,
      zhuyin,
      timestamp: hint.timestamp,
    };

    return { success: true, hint: hintDisplay };
  }

  allHintsSubmitted(roomId: string): boolean {
    const game = this.getGame(roomId);
    return game.hints.length >= game.hinters.length;
  }

  startGuessPhase(roomId: string, timeLimit: number): void {
    const game = this.getGame(roomId);
    game.phase = 'GUESS_PHASE';
    game.phaseStartTime = Date.now();
    game.phaseTimeLimit = timeLimit;
  }

  submitGuess(roomId: string, playerId: string, guess: string): GuessResult {
    const game = this.getGame(roomId);

    if (game.guesser?.id !== playerId) {
      throw new GameError('INVALID_ROLE', '只有猜字者可以猜字');
    }

    if (guess.length !== 1) {
      throw new GameError('INVALID_GUESS', '猜測必須是單一個字');
    }

    const isCorrect = guess === game.mainWord;

    game.guesses.push({
      guess,
      isCorrect,
      timestamp: Date.now(),
    });

    const maxGuesses = 3;
    const remainingGuesses = maxGuesses - game.guesses.length;

    if (isCorrect) {
      this.calculateRoundScore(game, true);
    }

    return {
      guess,
      isCorrect,
      correctAnswer: isCorrect || remainingGuesses <= 0 ? game.mainWord || undefined : undefined,
      remainingGuesses: Math.max(0, remainingGuesses),
    };
  }

  private calculateRoundScore(game: Game, guessedCorrectly: boolean): void {
    if (guessedCorrectly && game.guesser) {
      const guessCount = game.guesses.length;
      let guesserPoints = 0;
      if (guessCount === 1) guesserPoints = 100;
      else if (guessCount === 2) guesserPoints = 70;
      else if (guessCount === 3) guesserPoints = 50;

      game.scores[game.guesser.id] = (game.scores[game.guesser.id] || 0) + guesserPoints;

      // Hinters who gave valid hints
      game.hints.forEach((hint) => {
        game.scores[hint.playerId] = (game.scores[hint.playerId] || 0) + 30;
      });

      // Word setter
      if (game.wordSetter) {
        game.scores[game.wordSetter.id] = (game.scores[game.wordSetter.id] || 0) + 50;
      }
    }
  }

  endRound(roomId: string): RoundSummary {
    const game = this.getGame(roomId);

    const summary: RoundSummary = {
      round: game.currentRound,
      mainWord: game.mainWord || '',
      hints: [...game.hints],
      guesses: [...game.guesses],
      isCorrect: game.guesses.some((g) => g.isCorrect),
      scores: { ...game.scores },
    };

    game.roundHistory.push(summary);
    game.phase = 'ROUND_END';

    return summary;
  }

  nextRound(roomId: string): boolean {
    const game = this.getGame(roomId);

    if (game.currentRound >= game.maxRounds) {
      game.phase = 'GAME_END';
      return false;
    }

    game.currentRound++;
    game.mainWord = null;
    game.hints = [];
    game.guesses = [];

    // Rotate roles
    this.rotateRoles(game);

    game.phase = 'WORD_SELECTION';
    game.phaseStartTime = Date.now();

    return true;
  }

  private rotateRoles(game: Game): void {
    const allPlayers = [...game.players];

    // Find current guesser index and rotate
    const currentGuesserIndex = allPlayers.findIndex((p) => p.id === game.guesser?.id);
    const nextGuesserIndex = (currentGuesserIndex + 1) % allPlayers.length;
    const nextWordSetterIndex = (nextGuesserIndex + 1) % allPlayers.length;

    // Reset all roles
    allPlayers.forEach((p) => (p.role = 'HINTER'));

    game.guesser = allPlayers[nextGuesserIndex];
    game.wordSetter = allPlayers[nextWordSetterIndex];
    game.hinters = allPlayers.filter(
      (p) => p.id !== game.guesser?.id && p.id !== game.wordSetter?.id
    );

    game.guesser.role = 'GUESSER';
    game.wordSetter.role = 'WORD_SETTER';
  }

  endGame(roomId: string): GameResult {
    const game = this.getGame(roomId);
    game.phase = 'GAME_END';

    const sortedScores = Object.entries(game.scores).sort(([, a], [, b]) => b - a);
    const winnerId = sortedScores[0]?.[0];
    const winner = game.players.find((p) => p.id === winnerId);

    const winnerInfo: PlayerInfo | null = winner
      ? {
          id: winner.id,
          name: winner.name,
          isHost: winner.isHost,
          isReady: winner.isReady,
          isOnline: winner.isOnline,
          role: winner.role,
          score: winner.score,
        }
      : null;

    return {
      rounds: game.roundHistory,
      finalScores: game.scores,
      winner: winnerInfo,
    };
  }

  getGame(roomId: string): Game {
    const game = this.games.get(roomId);
    if (!game) {
      throw new GameError('GAME_NOT_FOUND', '遊戲不存在');
    }
    return game;
  }

  hasGame(roomId: string): boolean {
    return this.games.has(roomId);
  }

  deleteGame(roomId: string): void {
    this.games.delete(roomId);
  }

  getPublicGameState(roomId: string): GameState {
    const game = this.getGame(roomId);
    return {
      id: game.id,
      roomId: game.roomId,
      phase: game.phase,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      guesserId: game.guesser?.id || null,
      wordSetterId: game.wordSetter?.id || null,
      hinterIds: game.hinters.map((h) => h.id),
      mainWord: null, // Never expose main word in public state
      hints: game.hints.map((h) => ({
        playerId: h.playerId,
        playerName: h.playerName,
        zhuyin: h.zhuyin,
        timestamp: h.timestamp,
      })),
      guesses: game.guesses,
      scores: game.scores,
      phaseStartTime: game.phaseStartTime,
      phaseTimeLimit: game.phaseTimeLimit,
    };
  }

  getMainWord(roomId: string): string | null {
    const game = this.getGame(roomId);
    return game.mainWord;
  }
}

export class GameError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'GameError';
  }
}
