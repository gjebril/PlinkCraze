import { useCallback, useState } from 'react';
import type { DiceResult } from '../gameLogic';

const HISTORY_LENGTH = 5;

/** Rolling list of the most recent rolls. */
export function useGameHistory() {
  const [history, setHistory] = useState<DiceResult[]>([]);

  const addResult = useCallback((result: DiceResult) => {
    setHistory((prev) => {
      const next = [...prev, result];
      return next.length > HISTORY_LENGTH ? next.slice(next.length - HISTORY_LENGTH) : next;
    });
  }, []);

  return { history, addResult };
}
