'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { setRoom, setMyPlayer } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('請輸入你的名字');
      return;
    }

    if (!socket || !isConnected) {
      setError('正在連接伺服器...');
      return;
    }

    setIsCreating(true);
    setError('');

    socket.emit('room:create', { hostName: playerName.trim() }, (response) => {
      setIsCreating(false);
      if (response.success && response.room) {
        // The host is the first player - set player first so isHost can be calculated
        const hostPlayer = response.room.players[0];
        if (hostPlayer) {
          setMyPlayer(hostPlayer.id, hostPlayer.name);
        }
        // Save room data to store
        setRoom(response.room);
        router.push(`/room/${response.room.code}`);
      } else {
        setError(response.error || '建立房間失敗');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('請輸入你的名字');
      return;
    }

    if (!roomCode.trim()) {
      setError('請輸入房間代碼');
      return;
    }

    if (!socket || !isConnected) {
      setError('正在連接伺服器...');
      return;
    }

    setIsJoining(true);
    setError('');

    socket.emit(
      'room:join',
      roomCode.trim().toUpperCase(),
      playerName.trim(),
      undefined,
      (response) => {
        setIsJoining(false);
        if (response.success && response.room && response.player) {
          // Set player first so isHost can be calculated correctly
          setMyPlayer(response.player.id, response.player.name);
          // Save room data to store
          setRoom(response.room);
          router.push(`/room/${response.room.code}`);
        } else {
          setError(response.error || '加入房間失敗');
        }
      }
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-2">猜字遊戲</h1>
        <p className="text-gray-500 text-center mb-8">
          與朋友一起用注音猜字！
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">你的名字</label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="輸入暱稱..."
              maxLength={10}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || !isConnected}
              className="flex-1"
            >
              {isCreating ? '建立中...' : '建立房間'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">或</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">房間代碼</label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="輸入 4 位代碼..."
              maxLength={4}
              className="uppercase text-center text-xl tracking-widest"
            />
          </div>

          <Button
            onClick={handleJoinRoom}
            disabled={isJoining || !isConnected}
            variant="secondary"
            className="w-full"
          >
            {isJoining ? '加入中...' : '加入房間'}
          </Button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {!isConnected && (
            <p className="text-amber-500 text-sm text-center">
              正在連接伺服器...
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}
