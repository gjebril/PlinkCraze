import { useCallback } from 'react';
import { useSession } from '../../session/store';
import { playGame } from './gameLogic';
import Plinko from './Plinko';

/**
 * Integration layer. This is the seam where platform concerns (balance, auth,
 * currency, bet validation) would be wired in. For the standalone build it
 * forwards to the imitation API and reports settled bets to the session HUD.
 */
export default function PlinkoWrapper() {
  const { record } = useSession();
  const handlePlay = useCallback(() => playGame(), []);

  return <Plinko onPlay={handlePlay} onSettled={record} />;
}
