import { useCallback, useState } from 'react';

export interface HistoryItem {
  betId: string;
  result: number;
  diceValue: number;
  direction: string;
  isWin: boolean;
  timestamp: number;
}

export function useGameHistory() {
  const HistoryLength = 10;

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const addResult = useCallback(
    (betId: string, result: number, diceValue: number, direction: string, isWin: boolean) => {
      const newHistoryItem: HistoryItem = {
        betId,
        result,
        diceValue,
        direction,
        isWin,
        timestamp: Date.now(),
      };

      if (history.length < HistoryLength) {
        setHistory((prev) => [...prev, newHistoryItem]);
      } else {
        setHistory((prev) => [...prev.slice(1), newHistoryItem]);
      }
    },
    [history.length],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getResultColor = useCallback((result: number, diceValue: number, direction: string): 'win' | 'loss' => {
    if (direction === 'above') {
      return result > diceValue ? 'win' : 'loss';
    }
    return result < diceValue ? 'win' : 'loss';
  }, []);

  const getResultHistory = useCallback(() => {
    return history.map((item) => item.result);
  }, [history]);

  return {
    history,
    addResult,
    clearHistory,
    getResultColor,
    getResultHistory,
  };
}
