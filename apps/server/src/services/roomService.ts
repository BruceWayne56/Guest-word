import { nanoid } from 'nanoid';
import type {
  Room,
  RoomInfo,
  CreateRoomOptions,
  Player,
  PlayerInfo,
  DEFAULT_SETTINGS,
  toPlayerInfo,
} from '@guest-word/shared';

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map();

  createRoom(hostSocketId: string, options: CreateRoomOptions): Room {
    const room: Room = {
      id: nanoid(10),
      code: this.generateRoomCode(),
      name: options.name || `${options.hostName}的房間`,
      hostId: hostSocketId,
      players: [
        {
          id: nanoid(10),
          socketId: hostSocketId,
          name: options.hostName,
          isHost: true,
          isReady: true,
          isOnline: true,
          role: 'SPECTATOR',
          score: 0,
          joinedAt: Date.now(),
        },
      ],
      maxPlayers: options.maxPlayers || 8,
      minPlayers: 3,
      status: 'WAITING',
      isPrivate: options.isPrivate || false,
      password: options.password,
      settings: {
        rounds: options.rounds || 5,
        hintTimeLimit: options.hintTimeLimit || 60,
        guessTimeLimit: options.guessTimeLimit || 120,
        maxGuesses: options.maxGuesses || 3,
      },
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    this.rooms.set(room.id, room);
    this.playerRoomMap.set(hostSocketId, room.id);

    return room;
  }

  joinRoom(
    roomCode: string,
    socketId: string,
    playerName: string,
    password?: string
  ): { room: Room; player: Player } {
    const room = this.findRoomByCode(roomCode);

    if (!room) {
      throw new RoomError('ROOM_NOT_FOUND', '找不到房間');
    }

    if (room.status !== 'WAITING') {
      throw new RoomError('GAME_IN_PROGRESS', '遊戲已開始');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new RoomError('ROOM_FULL', '房間已滿');
    }

    if (room.isPrivate && room.password !== password) {
      throw new RoomError('WRONG_PASSWORD', '密碼錯誤');
    }

    const player: Player = {
      id: nanoid(10),
      socketId,
      name: playerName,
      isHost: false,
      isReady: false,
      isOnline: true,
      role: 'SPECTATOR',
      score: 0,
      joinedAt: Date.now(),
    };

    room.players.push(player);
    room.lastActivityAt = Date.now();
    this.playerRoomMap.set(socketId, room.id);

    return { room, player };
  }

  leaveRoom(socketId: string): { room: Room; wasHost: boolean; playerId: string } | null {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const player = room.players[playerIndex];
    const wasHost = player.isHost;
    const playerId = player.id;

    room.players.splice(playerIndex, 1);
    this.playerRoomMap.delete(socketId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].socketId;
    }

    room.lastActivityAt = Date.now();
    return { room, wasHost, playerId };
  }

  setPlayerReady(socketId: string, isReady: boolean): Room | null {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return null;

    player.isReady = isReady;
    room.lastActivityAt = Date.now();

    return room;
  }

  handleDisconnect(socketId: string): { roomId: string; playerId: string } | null {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return null;

    player.isOnline = false;
    const playerId = player.id;

    return { roomId, playerId };
  }

  handleReconnect(
    oldSocketId: string,
    newSocketId: string
  ): { room: Room; playerId: string } | null {
    const roomId = this.playerRoomMap.get(oldSocketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.socketId === oldSocketId);
    if (!player) return null;

    player.socketId = newSocketId;
    player.isOnline = true;

    this.playerRoomMap.delete(oldSocketId);
    this.playerRoomMap.set(newSocketId, roomId);

    return { room, playerId: player.id };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    const room = this.getRoomBySocketId(socketId);
    if (!room) return undefined;
    return room.players.find((p) => p.socketId === socketId);
  }

  canStartGame(room: Room): { canStart: boolean; reason?: string } {
    if (room.players.length < room.minPlayers) {
      return { canStart: false, reason: `至少需要 ${room.minPlayers} 名玩家` };
    }

    const allReady = room.players.every((p) => p.isReady);
    if (!allReady) {
      return { canStart: false, reason: '還有玩家未準備' };
    }

    return { canStart: true };
  }

  setRoomStatus(roomId: string, status: Room['status']): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      room.lastActivityAt = Date.now();
    }
  }

  toRoomInfo(room: Room): RoomInfo {
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      hostId: room.hostId,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isReady: p.isReady,
        isOnline: p.isOnline,
        role: p.role,
        score: p.score,
      })),
      maxPlayers: room.maxPlayers,
      minPlayers: room.minPlayers,
      status: room.status,
      isPrivate: room.isPrivate,
      settings: room.settings,
    };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    let attempts = 0;
    do {
      code = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
      attempts++;
    } while (this.findRoomByCode(code) && attempts < 100);
    return code;
  }

  private findRoomByCode(code: string): Room | undefined {
    return [...this.rooms.values()].find(
      (r) => r.code.toUpperCase() === code.toUpperCase()
    );
  }
}

export class RoomError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'RoomError';
  }
}
