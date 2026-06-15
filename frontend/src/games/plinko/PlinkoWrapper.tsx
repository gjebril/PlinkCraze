import { useCallback } from 'react';
import { playGame } from './gameLogic';
import Plinko from './Plinko';

/**
 * Integration layer. This is the seam where platform concerns (balance, auth,
 * currency, bet validation) would be wired in. For the standalone build it
 * simply forwards to the backend imitation API via `playGame`.
 */
export default function PlinkoWrapper() {
  const handlePlay = useCallback(() => playGame(), []);

  return <Plinko onPlay={handlePlay} />;
}
