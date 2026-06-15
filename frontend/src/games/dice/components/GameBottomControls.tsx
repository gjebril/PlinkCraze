import { memo } from 'react';
import type { DiceDirection } from '../gameLogic';

interface GameBottomControlsProps {
  amount: string;
  onAmountChange: (value: string) => void;
  target: number;
  onTargetChange: (value: number) => void;
  direction: DiceDirection;
  onToggleDirection: () => void;
  multiplierValue: number;
  winChanceValue: number;
  onRoll: () => void;
  disabled?: boolean;
}

/** Bet amount, target slider, direction toggle, and the ROLL button. */
function GameBottomControls({
  amount,
  onAmountChange,
  target,
  onTargetChange,
  direction,
  onToggleDirection,
  multiplierValue,
  winChanceValue,
  onRoll,
  disabled = false,
}: GameBottomControlsProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg bg-dark-blue-secondary p-4">
      <label className="flex flex-col gap-1 text-xs font-medium text-light-gray">
        Bet Amount
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
          className="rounded-md border border-dark-gray bg-dark-blue px-3 py-2 text-sm text-white outline-none focus:border-highlight-green"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-light-gray">
        Target: {target.toFixed(0)} ({direction})
        <input
          type="range"
          min={2}
          max={98}
          value={target}
          onChange={(e) => onTargetChange(Number(e.target.value))}
          className="w-full"
        />
      </label>

      <div className="flex items-center justify-between text-xs text-light-gray">
        <span>Multiplier: {multiplierValue.toFixed(4)}x</span>
        <span>Win chance: {winChanceValue.toFixed(2)}%</span>
      </div>

      <button
        type="button"
        onClick={onToggleDirection}
        className="rounded-md border border-dark-gray py-2 text-sm font-medium text-light-gray hover:text-white"
      >
        Roll {direction} ⇄
      </button>

      <button
        type="button"
        onClick={onRoll}
        disabled={disabled}
        className="w-full rounded-lg bg-highlight-green py-4 text-lg font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ROLL
      </button>
    </div>
  );
}

const MemoGameBottomControls = memo(GameBottomControls);
export default MemoGameBottomControls;
