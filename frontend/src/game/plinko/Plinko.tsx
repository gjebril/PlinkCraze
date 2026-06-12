import { useCallback, useRef, useState } from 'react';
import type { GameResult } from '../gameLogic';
import GameBottomControls from './components/GameBottomControls';
import GameDisplay from './components/GameDisplay';
import HistoryDisplay from './components/HistoryDisplay';
import type { PlinkoGame } from './game/game';
import { useBetting } from './hooks/useBetting';
import { useGameHistory } from './hooks/useGameHistory';
import { getMultiplierColor } from './utils';

export interface PlinkoProps {
  /** Calls the backend imitation API and resolves the predetermined result. */
  onPlay: () => Promise<GameResult>;
}

/**
 * Game orchestrator: owns bet/in-progress state, the result history, and wires
 * the Phaser board (GameDisplay) to the controls. Knows nothing about how the
 * result is fetched — that's the wrapper's job.
 */
export default function Plinko({ onPlay }: PlinkoProps) {
  const gameRef = useRef<PlinkoGame | null>(null);
  const [isGameInProgress, setIsGameInProgress] = useState(false);
  const { history, addResult } = useGameHistory();

  const drop = useCallback((result: GameResult) => {
    gameRef.current?.drop(result);
  }, []);

  const { bet, isLoading } = useBetting({ play: onPlay, drop });

  const handleBet = useCallback(() => {
    setIsGameInProgress(true);
    bet().catch((err) => {
      console.error('Bet failed:', err);
      setIsGameInProgress(false);
    });
  }, [bet]);

  const handleBallLanded = useCallback(
    (_sinkIndex: number, multiplier: number) => {
      addResult(multiplier, getMultiplierColor(multiplier).css);
      setIsGameInProgress(false);
    },
    [addResult],
  );

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-blue">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-stretch justify-center gap-4 p-4 lg:flex-row">
        {/* Controls */}
        <div className="flex w-full items-center lg:w-1/4">
          <GameBottomControls onBet={handleBet} disabled={isLoading || isGameInProgress} isLoading={isLoading} />
        </div>

        {/* Board */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="aspect-square w-full max-w-[800px]">
            <GameDisplay gameRef={gameRef} onBallLanded={handleBallLanded} />
          </div>
          <div className="absolute right-4 top-4 z-10">
            <HistoryDisplay history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
