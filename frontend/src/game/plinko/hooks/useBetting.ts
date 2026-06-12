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
  // Counter (not a boolean) so concurrent in-flight bets are tracked correctly —
  // multiple balls can be dropped before any of them lands.
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const bet = useCallback(async () => {
    setPending((p) => p + 1);
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
      setPending((p) => p - 1);
    }
  }, [play, drop]);

  return { bet, pendingCount: pending, isLoading: pending > 0, error };
}
