import { useCallback, useState } from 'react';
import type { GameResult } from '../../gameLogic';

/**
 * Bridges a bet request to the game: calls the backend imitation API,
 * then hands the resulting start position to the Phaser scene to animate.
 */
export function useBetting({
  play,
  drop,
}: {
  play: () => Promise<GameResult>;
  drop: (result: GameResult) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await play();
      drop(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [play, drop]);

  return { bet, isLoading, error };
}
