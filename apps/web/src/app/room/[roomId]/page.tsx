'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlayerList } from '@/components/room/PlayerList';
import { GameBoard } from '@/components/game/GameBoard';
import { RoundEndModal } from '@/components/game/RoundEndModal';
import { GameEndModal } from '@/components/game/GameEndModal';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomId as string;
  const { socket, isConnected } = useSocket();
  const {
    room,
    gameState,
    myPlayerId,
    isHost,
    roundSummary,
    gameResult,
    setRoom,
    setMyPlayer,
    updatePlayer,
    removePlayer,
    setGameState,
    setRoleAssignment,
    setMainWord,
    addHint,
    addGuess,
    setRoundSummary,
    setGameResult,
    reset,
  } = useGameStore();

  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on('room:playerJoined', (player) => {
      updatePlayer(player);
    });

    socket.on('room:playerLeft', (playerId) => {
      removePlayer(playerId);
    });

    socket.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('room:hostChanged', (newHostId) => {
      if (room) {
        const updatedPlayers = room.players.map((p) => ({
          ...p,
          isHost: p.id === newHostId,
        }));
        setRoom({ ...room, players: updatedPlayers, hostId: newHostId });
      }
    });

    socket.on('room:error', (err) => {
      setError(err.message);
    });

    // Game events
    socket.on('game:started', (state) => {
      setGameState(state);
    });

    socket.on('game:rolesAssigned', (roles) => {
      setRoleAssignment(roles);
    });

    socket.on('game:wordRevealed', (word) => {
      setMainWord(word);
    });

    socket.on('game:phaseChanged', (phase) => {
      if (gameState) {
        setGameState({ ...gameState, phase });
      }
    });

    socket.on('game:stateSync', (state) => {
      setGameState(state);
    });

    socket.on('game:hintSubmitted', (hint) => {
      addHint(hint);
    });

    socket.on('game:guessResult', (result) => {
      addGuess(result);
    });

    socket.on('game:roundEnd', (summary) => {
      setRoundSummary(summary);
    });

    socket.on('game:ended', (result) => {
      setGameResult(result);
    });

    socket.on('game:error', (message) => {
      setError(message);
    });

    return () => {
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('room:updated');
      socket.off('room:hostChanged');
      socket.off('room:error');
      socket.off('game:started');
      socket.off('game:rolesAssigned');
      socket.off('game:wordRevealed');
      socket.off('game:phaseChanged');
      socket.off('game:stateSync');
      socket.off('game:hintSubmitted');
      socket.off('game:guessResult');
      socket.off('game:roundEnd');
      socket.off('game:ended');
      socket.off('game:error');
    };
  }, [socket, room, gameState]);

  // Handle ready toggle
  const handleReady = () => {
    if (!socket) return;
    const newReady = !isReady;
    setIsReady(newReady);
    socket.emit('room:ready', newReady);
  };

  // Handle start game
  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('game:start');
  };

  // Handle leave room
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('room:leave');
    }
    reset();
    router.push('/');
  };

  // Check if game can start
  const canStartGame =
    room &&
    room.players.length >= room.minPlayers &&
    room.players.every((p) => p.isReady);

  // Show loading if no room data
  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <p className="text-gray-500">載入中...</p>
        </Card>
      </main>
    );
  }

  // Show game board if game is in progress
  if (gameState && gameState.phase !== 'WAITING') {
    return (
      <>
        <GameBoard />
        {roundSummary && <RoundEndModal />}
        {gameResult && <GameEndModal />}
      </>
    );
  }

  // Show waiting room
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-gray-500">
              房間代碼：
              <span className="font-mono font-bold text-primary-600 text-xl">
                {room.code}
              </span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
            離開
          </Button>
        </div>

        <PlayerList players={room.players} myPlayerId={myPlayerId} />

        <div className="mt-6 space-y-3">
          {!isHost && (
            <Button
              onClick={handleReady}
              variant={isReady ? 'secondary' : 'primary'}
              className="w-full"
            >
              {isReady ? '取消準備' : '準備'}
            </Button>
          )}

          {isHost && (
            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className="w-full"
            >
              {canStartGame ? '開始遊戲' : `等待玩家準備 (${room.players.length}/${room.minPlayers})`}
            </Button>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        <p className="mt-4 text-xs text-gray-400 text-center">
          需要至少 {room.minPlayers} 位玩家才能開始
        </p>
      </Card>
    </main>
  );
}
