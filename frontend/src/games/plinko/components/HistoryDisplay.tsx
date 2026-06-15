import { memo } from 'react';
import { BIN_TEXT_COLOR } from '../game/constants';
import type { MultiplierResult } from '../hooks/types';
import { formatMultiplier } from '../utils';

interface HistoryDisplayProps {
  history: MultiplierResult[];
}

/**
 * Recent results as a single flush column (cards share edges, no gaps),
 * newest on top, only the outer corners rounded.
 */
function HistoryDisplay({ history }: HistoryDisplayProps) {
  const newestFirst = [...history].reverse();

  return (
    <div className="overflow-hidden rounded-md shadow-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {newestFirst.map((result, index) => (
        <div
          key={`${result.multiplier}-${index}`}
          className="flex h-[34px] w-[72px] items-center justify-center text-xs font-bold"
          style={{ backgroundColor: result.color, color: BIN_TEXT_COLOR }}
        >
          {formatMultiplier(result.multiplier)}
        </div>
      ))}
    </div>
  );
}

const MemoHistoryDisplay = memo(HistoryDisplay);
export default MemoHistoryDisplay;
