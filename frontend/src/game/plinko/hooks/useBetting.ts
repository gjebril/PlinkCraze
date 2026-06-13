import { useCallback } from 'react';
import type { GameResult } from '../../gameLogic';

/**
 * Bridges a bet request to the game: calls the backend imitation API, then
 * hands the resulting start position to the Phaser scene to animate. Errors
 * propagate to the caller (the orchestrator decides how to surface them).
 */
export function useBetting({
  play,
  drop,
}: {
  play: () => Promise<GameResult>;
  drop: (result: GameResult) => void;
}) {
  const bet = useCallback(async () => {
    const result = await play();
    drop(result);
    return result;
  }, [play, drop]);

  return { bet };
}
