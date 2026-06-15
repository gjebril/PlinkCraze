import { useCallback } from 'react';
import { useSession } from '../../session/store';
import Dice from './Dice';
import { rollDice, type DiceDirection } from './gameLogic';

/**
 * Integration layer — the seam for platform concerns (balance, auth, currency,
 * bet validation). For the standalone build it forwards to the roll API and
 * reports settled bets to the session HUD.
 */
export default function DiceWrapper() {
  const { record } = useSession();
  const handlePlay = useCallback(
    (amount: number, target: number, direction: DiceDirection) => rollDice(amount, target, direction),
    [],
  );

  return <Dice onPlay={handlePlay} onSettled={record} />;
}
