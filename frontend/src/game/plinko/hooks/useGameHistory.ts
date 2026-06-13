import { useCallback, useState } from 'react';
import type { MultiplierResult } from './types';

const HISTORY_LENGTH = 5;

/** Keeps a rolling list of the most recent landed multipliers. */
export function useGameHistory() {
  const [history, setHistory] = useState<MultiplierResult[]>([]);

  const addResult = useCallback((multiplier: number, color: string) => {
    setHistory((prev) => {
      const next = [...prev, { multiplier, color }];
      return next.length > HISTORY_LENGTH ? next.slice(next.length - HISTORY_LENGTH) : next;
    });
  }, []);

  return { history, addResult };
}
