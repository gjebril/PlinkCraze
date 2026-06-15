import { dice_isWin } from '@bet-technology/inhousegames-jsclient/dist/dice';
import { MODAL_GEO_RESTRICTION } from 'constants/modal-names';
import { useGeoRestrictionStore } from 'features/geo-restriction';
import { DicePlayRequest } from 'hooks/queries/inhouseGames/dice/types';
import { useModals } from 'lib/modal';
import { useCallback, useEffect, useRef, useState } from 'react';
import AutoBet from '../../shared/hooks/autoBet';
import normalizeDiceDirection from '../utils';
import type { OnDicePlayResponse } from './types';

export function useBetting({
  onPlay,
  play,
  gameId,
  currencyCode,
  diceValue,
  direction,
}: {
  onPlay: (request: Omit<DicePlayRequest, 'casinoSessionId'>) => Promise<OnDicePlayResponse>;
  play: (
    betId: string,
    isWin: boolean,
    result: number,
    correlationId: string,
    diceValue: number,
    direction: string,
    onComplete: () => void,
  ) => Promise<void>;
  gameId: string;
  currencyCode: string;
  diceValue: number;
  direction: string;
}) {
  const [autoBetAmount, setAutoBetAmount] = useState<number>(0);

  const [autoBetRunning, setAutoBetRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isRestricted } = useGeoRestrictionStore();
  const { show } = useModals();

  const createCorrelationId = useCallback(() => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  const manualBet = useCallback(
    async (amount: number) => {
      if (isRestricted) {
        show(MODAL_GEO_RESTRICTION, true);
        throw new Error('User is restricted from betting');
      }
      setIsLoading(true);
      let response: OnDicePlayResponse;
      try {
        response = await onPlay({
          gameId,
          amount: amount,
          diceValue: diceValue,
          direction: direction,
          currency: currencyCode,
          correlationId: createCorrelationId(),
        });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
      const normalizedDirection = normalizeDiceDirection(direction);
      const isWin = dice_isWin(normalizedDirection, Number(diceValue), response.result);
      await play(response.betId, isWin, response.result, response.correlationId, diceValue, direction, () =>
        setIsLoading(false),
      );
      return { isWin, result: response.result, correlationId: response.correlationId, payout: response.payout };
    },
    [onPlay, gameId, currencyCode, createCorrelationId, play, diceValue, direction, isRestricted, show],
  );

  const autoBet = useRef<AutoBet | null>(new AutoBet((amount: number) => setAutoBetAmount(amount)));
  const { startAutoBet, stopAutoBet, running } = autoBet.current!;

  useEffect(() => {
    autoBet.current?.setOnBet(manualBet);
  }, [manualBet, diceValue, direction]);

  useEffect(() => {
    autoBet.current?.setOnStart(() => {
      setAutoBetRunning(true);
    });
    autoBet.current?.setOnStop(() => {
      setAutoBetRunning(false);
    });
  }, []);

  return {
    manualBet,

    startAutoBet,
    stopAutoBet,
    autoBetRunning,
    autoBetAmount,

    isAutoBetRunning: running,
    isLoading,
  };
}

export default useBetting;
