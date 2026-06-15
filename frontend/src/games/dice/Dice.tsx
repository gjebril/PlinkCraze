import { useCallback, useMemo, useRef, useState } from 'react';
import GameBottomControls from './components/GameBottomControls';
import GameDisplay from './components/GameDisplay';
import HistoryDisplay from './components/HistoryDisplay';
import type { DiceGame } from './game/game';
import type { DiceDirection, DiceResult } from './gameLogic';
import { useBetting } from './hooks/useBetting';
import { useGameHistory } from './hooks/useGameHistory';
import { multiplier, winChance } from './utils';

export interface DiceProps {
  /** Calls the roll API for the given bet. */
  onPlay: (amount: number, target: number, direction: DiceDirection) => Promise<DiceResult>;
  /** Reports a settled bet and its payout for the session HUD. */
  onSettled?: (bet: number, payout: number) => void;
}

/**
 * Dice orchestrator: owns bet/target/direction state, drives the scene, and
 * records history. Mirrors Plinko.tsx. (The Phaser scene itself is a scaffold —
 * see game/game.ts.)
 */
export default function Dice({ onPlay, onSettled }: DiceProps) {
  const gameRef = useRef<DiceGame | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [amount, setAmount] = useState('1.00');
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<DiceDirection>('Above');
  const { history, addResult } = useGameHistory();

  // The slider drag on the board is the source of truth for the target.
  const handleTargetChange = useCallback((value: number) => setTarget(value), []);

  const handleReady = useCallback(() => {
    setIsReady(true);
    gameRef.current?.setDirection(direction);
    gameRef.current?.setTarget(target);
  }, [direction, target]);

  const toggleDirection = useCallback(() => {
    setDirection((prev) => {
      const next = prev === 'Above' ? 'Under' : 'Above';
      gameRef.current?.setDirection(next);
      return next;
    });
  }, []);

  const onResult = useCallback(
    (result: DiceResult) => {
      gameRef.current?.roll(result.resultValue, result.isWin);
      addResult(result);
      onSettled?.(Number(amount) || 0, result.payout);
    },
    [addResult, amount, onSettled],
  );

  const { bet, isLoading } = useBetting({
    play: () => onPlay(Number(amount), target, direction),
    onResult,
  });

  const handleRoll = useCallback(() => {
    bet().catch((err) => console.error('Roll failed:', err));
  }, [bet]);

  const multiplierValue = useMemo(() => multiplier(target, direction), [target, direction]);
  const winChanceValue = useMemo(() => winChance(target, direction), [target, direction]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-blue">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-stretch justify-center gap-4 p-4 lg:flex-row">
        <div className="flex w-full items-center lg:w-1/4">
          <GameBottomControls
            amount={amount}
            onAmountChange={setAmount}
            target={target}
            direction={direction}
            onToggleDirection={toggleDirection}
            multiplierValue={multiplierValue}
            winChanceValue={winChanceValue}
            onRoll={handleRoll}
            disabled={!isReady || isLoading}
          />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative flex aspect-[900/320] w-full max-w-[900px] items-center">
            <GameDisplay gameRef={gameRef} onGameReady={handleReady} onTargetChange={handleTargetChange} />
            <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
              <HistoryDisplay history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
