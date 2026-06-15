import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { SessionContext } from './store';

/**
 * Session-only running totals (bet / payout / profit) across whatever games are
 * played this session. Purely cosmetic — not part of any game's logic.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [totalBet, setTotalBet] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);

  const record = useCallback((bet: number, payout: number) => {
    setTotalBet((b) => b + bet);
    setTotalPayout((p) => p + payout);
  }, []);

  const reset = useCallback(() => {
    setTotalBet(0);
    setTotalPayout(0);
  }, []);

  const value = useMemo(
    () => ({ totalBet, totalPayout, profit: totalPayout - totalBet, record, reset }),
    [totalBet, totalPayout, record, reset],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
