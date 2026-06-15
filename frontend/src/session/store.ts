import { createContext, useContext } from 'react';

export interface SessionContextValue {
  totalBet: number;
  totalPayout: number;
  profit: number;
  /** Record a settled bet and its payout (called by each game's wrapper). */
  record: (bet: number, payout: number) => void;
  reset: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
