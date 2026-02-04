'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function WordSelector() {
  const { socket } = useSocket();
  const [word, setWord] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!socket) return;

    if (word.length !== 1) {
      setError('請輸入一個中文字');
      return;
    }

    // Basic Chinese character check
    if (!/^[\u4e00-\u9fff]$/.test(word)) {
      setError('請輸入一個中文字');
      return;
    }

    setIsSubmitting(true);
    setError('');
    socket.emit('game:selectWord', word);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">選擇主字</h2>
        <p className="text-gray-500 text-sm">
          選擇一個字作為這回合的主字。
          <br />
          提示者會看到這個字，並用能與它組成兩字詞的字來提示猜字者。
        </p>
      </div>

      <div className="flex gap-2 justify-center">
        <Input
          value={word}
          onChange={(e) => {
            setWord(e.target.value.slice(-1)); // Only keep last character
            setError('');
          }}
          placeholder="輸入一個字"
          className="w-32 text-center text-3xl"
          maxLength={1}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !word}>
          {isSubmitting ? '提交中...' : '確認'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="text-center text-xs text-gray-400">
        提示：選擇可以組成多個兩字詞的字會更有趣！
      </div>
    </div>
  );
}
