import { useSession } from '../session/store';

const fmt = (n: number) => n.toFixed(2);

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[10px] uppercase tracking-wide text-light-gray/40">{label}</span>
      <span className="text-sm font-bold" style={{ color: color ?? '#ffffff' }}>
        {value}
      </span>
    </div>
  );
}

/** Top-right session HUD: total bet, payout, and profit. Cosmetic only. */
export default function SessionStats() {
  const { totalBet, totalPayout, profit, reset } = useSession();

  return (
    <div
      className="fixed right-3 top-3 z-50 flex items-center gap-4 rounded-lg bg-dark-blue-secondary/90 px-4 py-2 shadow-lg ring-1 ring-white/5"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <Stat label="Bet" value={fmt(totalBet)} />
      <Stat label="Payout" value={fmt(totalPayout)} />
      <Stat label="Profit" value={`${profit >= 0 ? '+' : ''}${fmt(profit)}`} color={profit >= 0 ? '#00e701' : '#ff2d7e'} />
      <button
        type="button"
        onClick={reset}
        title="Reset session"
        className="ml-1 text-light-gray/40 transition-colors hover:text-white"
      >
        ⟲
      </button>
    </div>
  );
}
