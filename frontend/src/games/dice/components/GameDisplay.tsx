import { memo, useEffect, useRef, useState } from 'react';
import { createDiceGame, type DiceGame } from '../game/game';

interface GameDisplayProps {
  gameRef: React.MutableRefObject<DiceGame | null>;
  onGameReady?: () => void;
}

/** React ↔ Phaser bridge for the Dice scene (mirrors Plinko's GameDisplay). */
function GameDisplay({ gameRef, onGameReady }: GameDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onGameReadyRef = useRef(onGameReady);
  useEffect(() => {
    onGameReadyRef.current = onGameReady;
  }, [onGameReady]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return undefined;

    try {
      const game = createDiceGame({ parent: containerRef.current });
      gameRef.current = game;
      game.setCallbacks({
        onGameReady: () => {
          setIsLoading(false);
          onGameReadyRef.current?.();
        },
      });
    } catch (err) {
      console.error('Failed to initialise Dice game:', err);
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
    return <div className="flex size-full items-center justify-center p-6 text-center text-red-400">{error}</div>;
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
