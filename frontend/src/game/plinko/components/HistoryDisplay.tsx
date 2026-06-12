import { memo } from 'react';
import type { MultiplierResult } from '../hooks/types';

interface HistoryDisplayProps {
  history: MultiplierResult[];
}

/** Vertical stack of the most recent multipliers, oldest fading out. */
function HistoryDisplay({ history }: HistoryDisplayProps) {
  return (
    <div className="flex flex-col space-y-2">
      {history.map((result, index) => (
        <div
          key={index}
          className="min-w-[60px] rounded border border-black/20 px-4 py-2 text-center text-sm font-bold shadow-lg"
          style={{
            backgroundColor: result.color,
            opacity: (index + 1) / history.length,
            color: result.multiplier === 16 ? '#ffffff' : '#000000',
          }}
        >
          {result.multiplier}x
        </div>
      ))}
    </div>
  );
}

export default memo(HistoryDisplay);
