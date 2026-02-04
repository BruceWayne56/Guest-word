'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function HintInput() {
  const { socket } = useSocket();
  const { hints, myPlayerId, mainWord } = useGameStore();
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if already submitted
  const hasSubmitted = hints.some((h) => h.playerId === myPlayerId);

  useEffect(() => {
    // Listen for hint rejection
    if (!socket) return;

    const handleRejection = (reason: string) => {
      setError(reason);
      setIsSubmitting(false);
    };

    socket.on('game:hintRejected', handleRejection);

    return () => {
      socket.off('game:hintRejected', handleRejection);
    };
  }, [socket]);

  const handleSubmit = () => {
    if (!socket || hasSubmitted) return;

    if (hint.length !== 1) {
      setError('請輸入一個中文字');
      return;
    }

    if (!/^[\u4e00-\u9fff]$/.test(hint)) {
      setError('請輸入一個中文字');
      return;
    }

    if (hint === mainWord) {
      setError('不能直接提示主字！');
      return;
    }

    setIsSubmitting(true);
    setError('');
    socket.emit('game:submitHint', hint);
  };

  if (hasSubmitted) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600">已提交提示！</p>
        <p className="text-sm text-gray-500 mt-1">等待其他提示者...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold mb-2">給出提示</h2>
        <p className="text-gray-500 text-sm">
          輸入一個可以與主字「{mainWord}」組成兩字詞的字。
          <br />
          系統會將你的字轉成注音給猜字者看。
        </p>
      </div>

      <div className="flex gap-2 justify-center">
        <Input
          value={hint}
          onChange={(e) => {
            setHint(e.target.value.slice(-1));
            setError('');
          }}
          placeholder="輸入一個字"
          className="w-32 text-center text-3xl"
          maxLength={1}
          disabled={isSubmitting}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !hint}>
          {isSubmitting ? '提交中...' : '送出'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}
