import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from '@mui/material';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createDiceGame, DiceGame, type DiceViewMode } from '../game/game';

export interface GameDisplayProps {
  onGameReady?: () => void;
  onAnimationEnd?: (correlationId: string) => void;
  targetDiceValue?: number;
  direction?: string;
  isGameInProgress?: boolean;
  gameRef?: React.MutableRefObject<DiceGame | null>;
  isSoundOn?: boolean;
  volume?: number;
  onSliderValueChange?: (value: number) => void;
  minDiceValue?: number;
  maxDiceValue?: number;
  compactView?: boolean;
  scale?: number;
}

const SLIDER_MIN_VALUE = 2;
const SLIDER_MAX_VALUE = 98;

function GameDisplay({
  onGameReady,
  onAnimationEnd,
  targetDiceValue = 50,
  direction = 'above',
  gameRef: externalGameRef,
  isSoundOn = true,
  volume = 70,
  onSliderValueChange,
  minDiceValue = 0,
  maxDiceValue = 100,
  compactView = false,
  scale,
}: GameDisplayProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('desktop'));
  // eslint-disable-next-line no-nested-ternary
  const viewMode: DiceViewMode = compactView ? 'compact' : isMobile ? 'mobile' : 'normal';

  const gameRef = useRef<DiceGame | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameIsLoading, setGameLoading] = useState(true);
  const [gameError, setGameError] = useState<string | null>(null);
  const onGameReadyRef = useRef(onGameReady);
  const onAnimationEndRef = useRef(onAnimationEnd);
  const onSliderValueChangeRef = useRef(onSliderValueChange);
  const targetDiceValueRef = useRef(targetDiceValue);
  const directionRef = useRef(direction);
  const isSoundOnRef = useRef(isSoundOn);
  const volumeRef = useRef(volume);
  const externalGameRefRef = useRef(externalGameRef);
  const minDiceValueRef = useRef(minDiceValue);
  const maxDiceValueRef = useRef(maxDiceValue);

  useEffect(() => {
    onGameReadyRef.current = onGameReady;
    onAnimationEndRef.current = onAnimationEnd;
    onSliderValueChangeRef.current = onSliderValueChange;
    targetDiceValueRef.current = targetDiceValue;
    directionRef.current = direction;
    isSoundOnRef.current = isSoundOn;
    volumeRef.current = volume;
    externalGameRefRef.current = externalGameRef;
    minDiceValueRef.current = minDiceValue;
    maxDiceValueRef.current = maxDiceValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onGameReady,
    onAnimationEnd,
    onSliderValueChange,
    targetDiceValue,
    direction,
    isSoundOn,
    externalGameRef,
    minDiceValue,
    maxDiceValue,
    // Note: volume is intentionally excluded to prevent game re-initialization
    // Volume changes are handled in a separate useEffect below (line 173-176)
  ]);

  const sliderValueChangeCallback = useCallback((value: number) => {
    const callback = onSliderValueChangeRef.current;
    if (callback) {
      callback(value);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current || gameError) {
      return undefined;
    }

    try {
      const phaserConfig: Phaser.Types.Core.GameConfig = {
        parent: containerRef.current,
      };

      const gameInstance = createDiceGame(phaserConfig, viewMode, scale);
      gameRef.current = gameInstance;

      const externalRef = externalGameRefRef.current;
      if (externalRef) {
        externalRef.current = gameInstance;
      }

      gameInstance.setTargetDiceValue(targetDiceValueRef.current);
      gameInstance.setDirection(directionRef.current);
      gameInstance.setMuted(!isSoundOnRef.current);
      gameInstance.setVolume(volumeRef.current);
      gameInstance.setMinDiceValue(SLIDER_MIN_VALUE);
      gameInstance.setMaxDiceValue(SLIDER_MAX_VALUE);
      gameInstance.setOnSliderValueChange(sliderValueChangeCallback);

      gameInstance.setCallbacks({
        onGameReady: () => {
          setGameLoading(false);

          if (gameRef.current) {
            gameRef.current.setOnSliderValueChange(sliderValueChangeCallback);
          }

          onGameReadyRef.current?.();
        },
        onAnimationEnd: (correlationId: string) => {
          onAnimationEndRef.current?.(correlationId);
        },
      });
    } catch (error) {
      console.error('Failed to initialize Dice game:', error);
      setGameError('Failed to load game. Please refresh the page.');
      setGameLoading(false);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
      const externalRef = externalGameRefRef.current;
      if (externalRef) {
        externalRef.current = null;
      }
    };
  }, [gameError, minDiceValue, maxDiceValue, sliderValueChangeCallback, viewMode, scale]);

  const prevTargetDiceValueRef = useRef(targetDiceValue);
  const prevDirectionRef = useRef(direction);
  const prevIsSoundOnRef = useRef(isSoundOn);
  const prevVolumeRef = useRef(volume);
  const prevMinDiceValueRef = useRef(minDiceValue);
  const prevMaxDiceValueRef = useRef(maxDiceValue);

  useEffect(() => {
    if (!gameRef.current) return;

    if (prevMinDiceValueRef.current !== minDiceValue) {
      gameRef.current.setMinDiceValue(minDiceValue);
      prevMinDiceValueRef.current = minDiceValue;
    }
    if (prevMaxDiceValueRef.current !== maxDiceValue) {
      gameRef.current.setMaxDiceValue(maxDiceValue);
      prevMaxDiceValueRef.current = maxDiceValue;
    }
    if (prevTargetDiceValueRef.current !== targetDiceValue) {
      gameRef.current.setTargetDiceValue(targetDiceValue);
      prevTargetDiceValueRef.current = targetDiceValue;
    }
    if (prevDirectionRef.current !== direction) {
      gameRef.current.setDirection(direction);
      prevDirectionRef.current = direction;
    }
    if (prevIsSoundOnRef.current !== isSoundOn) {
      gameRef.current.setMuted(!isSoundOn);
      prevIsSoundOnRef.current = isSoundOn;
    }
    if (prevVolumeRef.current !== volume) {
      gameRef.current.setVolume(volume);
      prevVolumeRef.current = volume;
    }
  }, [targetDiceValue, direction, isSoundOn, volume, minDiceValue, maxDiceValue]);

  const prevOnGameReadyRef = useRef(onGameReady);
  const prevOnAnimationEndRef = useRef(onAnimationEnd);

  useEffect(() => {
    if (!gameRef.current) return;

    const callbacksChanged =
      prevOnGameReadyRef.current !== onGameReady || prevOnAnimationEndRef.current !== onAnimationEnd;

    if (callbacksChanged) {
      gameRef.current.setCallbacks({
        onGameReady: () => {
          setGameLoading(false);
          onGameReadyRef.current?.();
        },
        onAnimationEnd: (correlationId: string) => {
          onAnimationEndRef.current?.(correlationId);
        },
      });
      prevOnGameReadyRef.current = onGameReady;
      prevOnAnimationEndRef.current = onAnimationEnd;
    }
  }, [onGameReady, onAnimationEnd]);

  if (gameError) {
    return (
      <Box className="flex size-full items-center justify-center">
        <Box className="flex flex-col items-center justify-center gap-4">
          <Typography variant="h6" className="text-red-500">
            {gameError}
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Please refresh the page to try again.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="relative flex h-[500px] max-h-[500px] w-full mobile:h-[418px] desktop:h-full desktop:max-h-none">
      <Box
        ref={containerRef}
        className="size-full"
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      />

      {gameIsLoading && (
        <Box className="absolute inset-0 z-20 flex items-center justify-center">
          <Box className="absolute inset-0 opacity-50 dark:bg-black" />
          <Box className="relative z-10 flex flex-col items-center justify-center gap-4">
            <CircularProgress />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default memo(GameDisplay);
