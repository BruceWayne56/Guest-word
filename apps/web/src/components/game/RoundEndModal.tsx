'use client';

import { useGameStore } from '@/stores/gameStore';
import { Card } from '@/components/ui/Card';

export function RoundEndModal() {
  const { roundSummary } = useGameStore();

  if (!roundSummary) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-center mb-4">
          {roundSummary.isCorrect ? '🎉 猜對了！' : '😅 這回合結束'}
        </h2>

        <div className="text-center mb-6">
          <p className="text-gray-500 mb-2">答案是</p>
          <p className="text-5xl font-bold text-primary-600">
            {roundSummary.mainWord}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-medium text-gray-500">提示的詞彙</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {roundSummary.hints.map((hint, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg"
              >
                {hint.word || `${hint.hintChar}${roundSummary.mainWord}`}
              </span>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm">
          下一回合即將開始...
        </p>
      </Card>
    </div>
  );
}
