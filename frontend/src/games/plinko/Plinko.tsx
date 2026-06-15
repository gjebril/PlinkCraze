import { useCallback, useRef, useState } from 'react';
import type { GameResult } from './gameLogic';
import GameBottomControls from './components/GameBottomControls';
import GameDisplay from './components/GameDisplay';
import HistoryDisplay from './components/HistoryDisplay';
import type { PlinkoGame } from './game/game';
import { useBetting } from './hooks/useBetting';
import { useGameHistory } from './hooks/useGameHistory';
import { getBinColor } from './utils';

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
  const [isReady, setIsReady] = useState(false);
  const { history, addResult } = useGameHistory();

  const drop = useCallback((result: GameResult) => {
    gameRef.current?.drop(result.point);
  }, []);

  const { bet } = useBetting({ play: onPlay, drop });

  // Fire-and-forget: each click drops another ball; we never wait for a
  // previous ball to reach a sink, so many balls can be in play at once.
  const handleBet = useCallback(() => {
    bet().catch((err) => console.error('Bet failed:', err));
  }, [bet]);

  const handleBallLanded = useCallback(
    (sinkIndex: number, multiplier: number) => {
      addResult(multiplier, getBinColor(sinkIndex).css);
    },
    [addResult],
  );

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-blue">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-stretch justify-center gap-4 p-4 lg:flex-row">
        {/* Controls */}
        <div className="flex w-full items-center lg:w-1/4">
          <GameBottomControls onBet={handleBet} disabled={!isReady} />
        </div>

        {/* Board */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative aspect-square w-full max-w-[800px]">
            <GameDisplay gameRef={gameRef} onGameReady={() => setIsReady(true)} onBallLanded={handleBallLanded} />
            <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
              <HistoryDisplay history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
