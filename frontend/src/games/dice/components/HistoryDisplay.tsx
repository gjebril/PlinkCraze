import { memo } from 'react';
import { COLORS } from '../game/constants';
import type { DiceResult } from '../gameLogic';

interface HistoryDisplayProps {
  history: DiceResult[];
}

const toHex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Recent rolls, newest on top, green/red by win. */
function HistoryDisplay({ history }: HistoryDisplayProps) {
  const newestFirst = [...history].reverse();

  return (
    <div className="flex flex-col gap-1.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {newestFirst.map((r, index) => (
        <div
          key={`${r.betId}-${index}`}
          className="flex h-[44px] w-[88px] items-center justify-center rounded-md text-sm font-bold text-black shadow-md"
          style={{ backgroundColor: toHex(r.isWin ? COLORS.WIN : COLORS.LOSS) }}
        >
          {r.resultValue.toFixed(2)}
        </div>
      ))}
    </div>
  );
}

const MemoHistoryDisplay = memo(HistoryDisplay);
export default MemoHistoryDisplay;
