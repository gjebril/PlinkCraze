import { useSession } from '../session/store';

const fmt = (n: number) => n.toFixed(2);

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-[15px] uppercase tracking-wide text-light-gray/40">{label}</span>
      <span className="text-[21px] font-bold" style={{ color: color ?? '#ffffff' }}>
        {value}
      </span>
    </div>
  );
}

/** Top-center session HUD: total bet, payout, and profit. Cosmetic only. */
export default function SessionStats() {
  const { totalBet, totalPayout, profit, reset } = useSession();
  const profitPct = totalBet > 0 ? (profit / totalBet) * 100 : 0;
  const profitColor = profit >= 0 ? '#00e701' : '#ff2d7e';

  return (
    <div
      className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-9 rounded-xl bg-dark-blue-secondary/90 px-9 py-3 shadow-lg ring-1 ring-white/5"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <Stat label="Bet" value={fmt(totalBet)} />
      <Stat label="Payout" value={fmt(totalPayout)} />
      <Stat label="Profit" value={`${profit >= 0 ? '+' : ''}${fmt(profit)}`} color={profitColor} />
      <Stat label="Profit %" value={`${profit >= 0 ? '+' : ''}${profitPct.toFixed(1)}%`} color={profitColor} />
      <button
        type="button"
        onClick={reset}
        title="Reset session"
        className="ml-1 text-xl text-light-gray/40 transition-colors hover:text-white"
      >
        ⟲
      </button>
    </div>
  );
}
