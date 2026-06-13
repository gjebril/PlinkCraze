import { memo, useEffect, useRef, useState } from 'react';
import { createPlinkoGame, type PlinkoGame } from '../game/game';

interface GameDisplayProps {
  gameRef: React.MutableRefObject<PlinkoGame | null>;
  onGameReady?: () => void;
  onBallLanded?: (sinkIndex: number, multiplier: number, startX: number) => void;
}

/**
 * React ↔ Phaser bridge. Owns the lifecycle of the Phaser game inside a div
 * and forwards scene events to the parent. Callbacks are read through refs so
 * prop changes never force the game to re-initialise (the dice pattern).
 */
function GameDisplay({ gameRef, onGameReady, onBallLanded }: GameDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onGameReadyRef = useRef(onGameReady);
  const onBallLandedRef = useRef(onBallLanded);
  useEffect(() => {
    onGameReadyRef.current = onGameReady;
    onBallLandedRef.current = onBallLanded;
  }, [onGameReady, onBallLanded]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return undefined;

    try {
      const game = createPlinkoGame({ parent: containerRef.current });
      gameRef.current = game;
      game.setCallbacks({
        onGameReady: () => {
          setIsLoading(false);
          onGameReadyRef.current?.();
        },
        onBallLanded: (sinkIndex, multiplier, startX) => onBallLandedRef.current?.(sinkIndex, multiplier, startX),
      });
    } catch (err) {
      console.error('Failed to initialise Plinko game:', err);
      setError('Failed to load game. Please refresh the page.');
      setIsLoading(false);
    }

    const ref = gameRef;
    return () => {
      ref.current?.destroy();
      ref.current = null;
    };
  }, [gameRef]);

  if (error) {
    return (
      <div className="flex size-full items-center justify-center p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="size-full" />
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-blue/60">
          <div className="size-10 animate-spin rounded-full border-4 border-light-gray/30 border-t-highlight-green" />
        </div>
      )}
    </div>
  );
}

const MemoGameDisplay = memo(GameDisplay);
export default MemoGameDisplay;
