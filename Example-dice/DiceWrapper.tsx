import { Skeleton } from '@mui/material';
import { MODAL_AUTH } from 'constants/modal-names';
import { DicePlayRequest } from 'hooks/queries/inhouseGames/dice/types';
import usePlayDiceCommand from 'hooks/queries/inhouseGames/dice/usePlayDiceCommand';
import useFallbackTranslation from 'hooks/useFallbackTranslation';
import { useModals } from 'lib/modal';
import { memo, useCallback, useMemo } from 'react';
import { DiceGameConfig, InhouseGameDetails, InhouseGameProperties } from 'services/accounting/games/inhouse/types';
import useInHouseGameDetails from 'services/accounting/games/inhouse/useInHouseGameDetails';
import useBalanceStore from 'stores/balance/store';
import { usePasswiser } from 'lib/passwiser/usePasswiser';
import { useInHouseGameWrapper } from '../shared/hooks/useInHouseGameWrapper';
import { handleHttpError } from '../shared/utils/handleHttpError';
import Dice from './Dice';
import { OnDicePlayResponse } from './hooks/types';

export interface DiceWrapperProps {
  gameDetailsData?: InhouseGameDetails;
}

function DiceWrapper({ gameDetailsData }: DiceWrapperProps) {
  const { isAuthenticated } = usePasswiser();
  const { show } = useModals();
  const { selectedCurrency, updatePendingBalance } = useBalanceStore();
  const diceCommand = usePlayDiceCommand();
  const { t } = useFallbackTranslation('internal-games');

  const currencyCode = useMemo(() => selectedCurrency?.currencyCode || undefined, [selectedCurrency?.currencyCode]);

  const {
    data: inHouseGameDetails,
    isLoading: isInHouseGameDetailsLoading,
    isRefetching: isInHouseGameDetailsRefetching,
  } = useInHouseGameDetails(gameDetailsData?.inhouseGameProperties?.type, currencyCode, {
    enabled: !isAuthenticated || !!currencyCode,
  });

  const { currencyValidation, casinoSessionIdRef, isLoadingFromFocus } = useInHouseGameWrapper({
    inHouseGameDetails,
    isInHouseGameDetailsRefetching,
    selectedCurrencyCode: currencyCode,
  });

  const openAuthForSignUp = useCallback(() => {
    show(MODAL_AUTH, true);
  }, [show]);

  const handlePlay = useCallback(
    async (request: Omit<DicePlayRequest, 'casinoSessionId'>) => {
      if (!currencyValidation.isValid || !casinoSessionIdRef.current) {
        throw new Error(t('errors.currency-not-supported'));
      }
      updatePendingBalance(request.correlationId, false);

      try {
        const response = await diceCommand.mutateAsync({ ...request, casinoSessionId: casinoSessionIdRef.current });

        if (!response.success || response.data === undefined) {
          throw new Error(t('errors.failed-to-play-dice'));
        }

        const responseData: OnDicePlayResponse = {
          betId: response.data.betId,
          payout: response.data.payout,
          result: response.data.result,
          direction: response.data.direction,
          correlationId: request.correlationId,
          casinoSessionId: response.data.casinoSessionId,
        };

        casinoSessionIdRef.current = response.data.casinoSessionId;

        return responseData;
      } catch (error) {
        updatePendingBalance(request.correlationId, true);
        handleHttpError(error, t);
        throw error;
      }
    },
    [diceCommand, updatePendingBalance, currencyValidation.isValid, casinoSessionIdRef, t],
  );

  const onAnimationEnd = useCallback(
    (correlationId: string) => {
      updatePendingBalance(correlationId, true);
    },
    [updatePendingBalance],
  );

  const inhouseGameProperties = useMemo(
    () => inHouseGameDetails?.data?.inhouseGameProperties as unknown as InhouseGameProperties | undefined,
    [inHouseGameDetails?.data?.inhouseGameProperties],
  );

  const selectedCurrencyCode = useMemo(() => selectedCurrency?.currencyCode ?? 'BTC', [selectedCurrency?.currencyCode]);

  const currencyLimit =
    currencyValidation.currencyLimit ??
    inhouseGameProperties?.currencyLimits?.find((limit) => limit.currencyCode === selectedCurrencyCode) ??
    inhouseGameProperties?.currencyLimits?.[0];

  const gameProperties = useMemo(
    () =>
      currencyLimit && inhouseGameProperties
        ? {
            currencyLimit,
            configs: inhouseGameProperties.configs as DiceGameConfig,
            type: inhouseGameProperties.type,
            description: gameDetailsData?.inhouseGameProperties?.description,
          }
        : undefined,
    [currencyLimit, inhouseGameProperties, gameDetailsData?.inhouseGameProperties?.description],
  );

  const onPlayOrAuth = useMemo(() => {
    if (!isAuthenticated) {
      return async () => {
        openAuthForSignUp();
        throw new Error(t('errors.currency-not-supported'));
      };
    }
    return handlePlay;
  }, [isAuthenticated, openAuthForSignUp, handlePlay, t]);

  if (!gameDetailsData?.inhouseGameProperties) {
    return <div>Error: Invalid game configuration</div>;
  }

  if (isInHouseGameDetailsLoading || !gameProperties) {
    return <Skeleton variant="rectangular" width="100%" height="660px" />;
  }

  return (
    <Dice
      isGameDetailsLoading={isLoadingFromFocus}
      isCurrencyValid={currencyValidation.isValid}
      hasCasinoSessionId={currencyValidation.hasCasinoSessionId}
      isAuthenticated={isAuthenticated}
      currencyCode={selectedCurrencyCode}
      balance={selectedCurrency?.amount ?? 0}
      gameId={gameDetailsData.id}
      gameProperties={gameProperties}
      onPlay={onPlayOrAuth}
      onAnimationEnd={onAnimationEnd}
    />
  );
}

export default memo(DiceWrapper);
