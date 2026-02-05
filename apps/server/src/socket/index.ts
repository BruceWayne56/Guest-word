import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@guest-word/shared';
import { RoomService, RoomError } from '../services/roomService.js';
import { GameService, GameError } from '../services/gameService.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function setupSocket(
  httpServer: HttpServer,
  roomService: RoomService,
  gameService: GameService
) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: true, // 允許所有來源（開發環境）
        methods: ['GET', 'POST'],
        credentials: true,
      },
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      },
    }
  );

  io.on('connection', (socket: GameSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // Room events
    socket.on('room:create', (options, callback) => {
      try {
        const room = roomService.createRoom(socket.id, options);
        socket.join(room.id);
        socket.data.roomId = room.id;
        socket.data.playerId = room.players[0].id;
        socket.data.playerName = options.hostName;

        callback({ success: true, room: roomService.toRoomInfo(room) });
      } catch (error) {
        const message = error instanceof Error ? error.message : '建立房間失敗';
        callback({ success: false, error: message });
      }
    });

    socket.on('room:join', (roomCode, playerName, password, callback) => {
      try {
        const { room, player } = roomService.joinRoom(roomCode, socket.id, playerName, password);
        socket.join(room.id);
        socket.data.roomId = room.id;
        socket.data.playerId = player.id;
        socket.data.playerName = playerName;

        const roomInfo = roomService.toRoomInfo(room);
        const playerInfo = {
          id: player.id,
          name: player.name,
          isHost: player.isHost,
          isReady: player.isReady,
          isOnline: player.isOnline,
          role: player.role,
          score: player.score,
        };

        socket.to(room.id).emit('room:playerJoined', playerInfo);
        callback({ success: true, room: roomInfo, player: playerInfo });
      } catch (error) {
        if (error instanceof RoomError) {
          callback({ success: false, error: error.message });
        } else {
          callback({ success: false, error: '加入房間失敗' });
        }
      }
    });

    socket.on('room:leave', () => {
      const result = roomService.leaveRoom(socket.id);
      if (result) {
        socket.leave(result.room.id);
        io.to(result.room.id).emit('room:playerLeft', result.playerId);
        if (result.wasHost) {
          io.to(result.room.id).emit('room:hostChanged', result.room.hostId);
        }
      }
    });

    socket.on('room:ready', (isReady) => {
      const room = roomService.setPlayerReady(socket.id, isReady);
      if (room) {
        io.to(room.id).emit('room:updated', roomService.toRoomInfo(room));
      }
    });

    // Game events
    socket.on('game:start', () => {
      try {
        const room = roomService.getRoomBySocketId(socket.id);
        if (!room) {
          socket.emit('game:error', '找不到房間');
          return;
        }

        if (room.hostId !== socket.id) {
          socket.emit('game:error', '只有房主可以開始遊戲');
          return;
        }

        const canStart = roomService.canStartGame(room);
        if (!canStart.canStart) {
          socket.emit('game:error', canStart.reason || '無法開始遊戲');
          return;
        }

        const game = gameService.createGame(room);
        roomService.setRoomStatus(room.id, 'PLAYING');

        // Send role assignments to each player
        room.players.forEach((player) => {
          const roleAssignment = gameService.getRoleAssignment(game, player.id);
          io.to(player.socketId).emit('game:rolesAssigned', roleAssignment);
        });

        io.to(room.id).emit('game:started', gameService.getPublicGameState(room.id));
        io.to(room.id).emit('game:phaseChanged', 'WORD_SELECTION');
      } catch (error) {
        const message = error instanceof Error ? error.message : '開始遊戲失敗';
        socket.emit('game:error', message);
      }
    });

    socket.on('game:selectWord', (word) => {
      try {
        const room = roomService.getRoomBySocketId(socket.id);
        if (!room) return;

        const player = roomService.getPlayerBySocketId(socket.id);
        if (!player) return;

        gameService.setMainWord(room.id, word, player.id);

        // Reveal word to word setter and hinters
        const game = gameService.getGame(room.id);
        const revealTo = [game.wordSetter, ...game.hinters].filter(Boolean);
        revealTo.forEach((p) => {
          if (p) {
            io.to(p.socketId).emit('game:wordRevealed', word);
          }
        });

        // Tell guesser that word has been selected
        if (game.guesser) {
          io.to(game.guesser.socketId).emit('game:wordSelected');
        }

        // Start hint phase
        gameService.startHintPhase(room.id, room.settings.hintTimeLimit);
        io.to(room.id).emit('game:phaseChanged', 'HINT_PHASE');
        io.to(room.id).emit('game:stateSync', gameService.getPublicGameState(room.id));
      } catch (error) {
        if (error instanceof GameError) {
          socket.emit('game:error', error.message);
        }
      }
    });

    socket.on('game:submitHint', (hintChar) => {
      try {
        const room = roomService.getRoomBySocketId(socket.id);
        if (!room) return;

        const player = roomService.getPlayerBySocketId(socket.id);
        if (!player) return;

        const result = gameService.submitHint(room.id, player.id, hintChar);

        if (result.success && result.hint) {
          io.to(room.id).emit('game:hintSubmitted', result.hint);

          // Check if all hints submitted
          if (gameService.allHintsSubmitted(room.id)) {
            gameService.startGuessPhase(room.id, room.settings.guessTimeLimit);
            io.to(room.id).emit('game:phaseChanged', 'GUESS_PHASE');
            io.to(room.id).emit('game:stateSync', gameService.getPublicGameState(room.id));
          }
        } else {
          socket.emit('game:hintRejected', result.reason || '提示無效');
        }
      } catch (error) {
        if (error instanceof GameError) {
          socket.emit('game:error', error.message);
        }
      }
    });

    socket.on('game:guess', (guess) => {
      try {
        const room = roomService.getRoomBySocketId(socket.id);
        if (!room) return;

        const player = roomService.getPlayerBySocketId(socket.id);
        if (!player) return;

        const result = gameService.submitGuess(room.id, player.id, guess);
        io.to(room.id).emit('game:guessResult', result);

        if (result.isCorrect || result.remainingGuesses <= 0) {
          const summary = gameService.endRound(room.id);
          io.to(room.id).emit('game:roundEnd', summary);

          // Auto advance to next round after delay
          setTimeout(() => {
            if (gameService.hasGame(room.id)) {
              const hasNextRound = gameService.nextRound(room.id);
              if (hasNextRound) {
                io.to(room.id).emit('game:phaseChanged', 'WORD_SELECTION');
                io.to(room.id).emit('game:stateSync', gameService.getPublicGameState(room.id));

                // Send new role assignments
                room.players.forEach((p) => {
                  const game = gameService.getGame(room.id);
                  const roleAssignment = gameService.getRoleAssignment(game, p.id);
                  io.to(p.socketId).emit('game:rolesAssigned', roleAssignment);
                });
              } else {
                const gameResult = gameService.endGame(room.id);
                io.to(room.id).emit('game:ended', gameResult);
                roomService.setRoomStatus(room.id, 'FINISHED');
                gameService.deleteGame(room.id);
              }
            }
          }, 5000);
        }
      } catch (error) {
        if (error instanceof GameError) {
          socket.emit('game:error', error.message);
        }
      }
    });

    socket.on('game:skipRound', () => {
      try {
        const room = roomService.getRoomBySocketId(socket.id);
        if (!room) return;

        if (room.hostId !== socket.id) {
          socket.emit('game:error', '只有房主可以跳過回合');
          return;
        }

        const summary = gameService.endRound(room.id);
        io.to(room.id).emit('game:roundEnd', summary);

        const hasNextRound = gameService.nextRound(room.id);
        if (hasNextRound) {
          io.to(room.id).emit('game:phaseChanged', 'WORD_SELECTION');
          io.to(room.id).emit('game:stateSync', gameService.getPublicGameState(room.id));
        } else {
          const gameResult = gameService.endGame(room.id);
          io.to(room.id).emit('game:ended', gameResult);
          roomService.setRoomStatus(room.id, 'FINISHED');
          gameService.deleteGame(room.id);
        }
      } catch (error) {
        if (error instanceof GameError) {
          socket.emit('game:error', error.message);
        }
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      const result = roomService.handleDisconnect(socket.id);
      if (result) {
        io.to(result.roomId).emit('room:playerDisconnected', result.playerId);
      }
    });
  });

  return io;
}
