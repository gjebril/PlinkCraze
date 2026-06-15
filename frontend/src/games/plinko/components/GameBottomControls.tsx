import { memo, useState } from 'react';

interface GameBottomControlsProps {
  onBet: () => void;
  disabled?: boolean;
}

/**
 * Minimal betting panel: a cosmetic bet-amount field and the BET button.
 * The button stays enabled so multiple balls can be dropped in quick
 * succession. (Balance/auth/auto-bet are intentionally out of scope.)
 */
function GameBottomControls({ onBet, disabled = false }: GameBottomControlsProps) {
  const [amount, setAmount] = useState('1.00');

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg bg-dark-blue-secondary p-4">
      <label className="flex flex-col gap-1 text-xs font-medium text-light-gray">
        Bet Amount
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          className="rounded-md border border-dark-gray bg-dark-blue px-3 py-2 text-sm text-white outline-none focus:border-highlight-green"
        />
      </label>

      <button
        type="button"
        onClick={onBet}
        disabled={disabled}
        className="w-full rounded-lg bg-highlight-green py-4 text-lg font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        BET
      </button>
    </div>
  );
}

const MemoGameBottomControls = memo(GameBottomControls);
export default MemoGameBottomControls;
