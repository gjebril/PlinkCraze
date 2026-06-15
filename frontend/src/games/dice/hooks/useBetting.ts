import { useCallback, useState } from 'react';
import type { DiceResult } from '../gameLogic';

/** Calls the roll API, then forwards the result to the scene/history. */
export function useBetting({
  play,
  onResult,
}: {
  play: () => Promise<DiceResult>;
  onResult: (result: DiceResult) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const bet = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await play();
      onResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [play, onResult]);

  return { bet, isLoading };
}
