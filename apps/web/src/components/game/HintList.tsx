import type { HintDisplay } from '@guest-word/shared';

interface HintListProps {
  hints: HintDisplay[];
}

export function HintList({ hints }: HintListProps) {
  if (hints.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        還沒有提示...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-500">提示（注音）</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {hints.map((hint, index) => (
          <div key={index} className="text-center">
            <div className="zhuyin-card">{hint.zhuyin}</div>
            <p className="text-xs text-gray-400 mt-1">{hint.playerName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
