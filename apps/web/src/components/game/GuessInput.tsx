'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function GuessInput() {
  const { socket } = useSocket();
  const { guesses } = useGameStore();
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxGuesses = 3;
  const remainingGuesses = maxGuesses - guesses.length;
  const lastGuess = guesses[guesses.length - 1];

  const handleSubmit = () => {
    if (!socket || remainingGuesses <= 0) return;

    if (guess.length !== 1) {
      setError('請輸入一個中文字');
      return;
    }

    if (!/^[\u4e00-\u9fff]$/.test(guess)) {
      setError('請輸入一個中文字');
      return;
    }

    setIsSubmitting(true);
    setError('');
    socket.emit('game:guess', guess);

    // Reset after submit
    setTimeout(() => {
      setIsSubmitting(false);
      setGuess('');
    }, 500);
  };

  if (lastGuess?.isCorrect) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-green-600 font-bold text-xl">猜對了！</p>
        <p className="text-gray-500 mt-1">
          答案是「{lastGuess.correctAnswer}」
        </p>
      </div>
    );
  }

  if (remainingGuesses <= 0) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 font-bold">沒有猜中...</p>
        <p className="text-gray-500 mt-1">
          答案是「{lastGuess?.correctAnswer}」
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold mb-2">猜猜主字是什麼？</h2>
        <p className="text-gray-500 text-sm">
          根據上面的注音提示，猜出主字是什麼。
        </p>
        <p className="text-sm mt-2">
          剩餘猜測次數：
          <span className="font-bold text-primary-600">{remainingGuesses}</span>
        </p>
      </div>

      {guesses.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {guesses.map((g, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-red-100 text-red-600 rounded-lg"
            >
              {g.guess} ✗
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Input
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value.slice(-1));
            setError('');
          }}
          placeholder="輸入你的猜測"
          className="w-32 text-center text-3xl"
          maxLength={1}
          disabled={isSubmitting}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !guess}>
          {isSubmitting ? '提交中...' : '猜！'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );
}
