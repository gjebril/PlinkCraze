import {
  dice_calculate_chanceToWin,
  dice_calculate_multiplier,
  dice_calculate_potentialProfit,
} from '@bet-technology/inhousegames-jsclient/dist/dice';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { CRYPTO_DECIMAL_PLACES } from 'constants/maxgate';
import { GameFooter } from 'features/internal-games/shared/components/GameFooter';
import { useFormik } from 'formik';
import { DicePlayRequest } from 'hooks/queries/inhouseGames/dice/types';
import useFallbackTranslation from 'hooks/useFallbackTranslation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiceGameConfig } from 'services/accounting/games/inhouse/types';
import useBalanceStore from 'stores/balance/store';
import * as yup from 'yup';
import AutoBettingPanel from '../shared/components/AutoBettingPanel';
import BettingPanel from '../shared/components/BettingPanel';
import ManualBettingPanel from '../shared/components/ManualBettingPanel';
import type { AutoBettingValues, SharedBettingFormValues } from '../shared/components/types';
import useBetAmount from '../shared/hooks/useBetAmount';
import { useDialog } from '../shared/hooks/useDialog';
import useFiatCryptoDisplay from '../shared/hooks/useFiatCryptoDisplay';
import useSettings from '../shared/hooks/useSettings';
import GameBottomControls from './components/GameBottomControls';
import GameDisplay from './components/GameDisplay';
import HistoryDisplay from './components/HistoryDisplay';
import { DiceGame as DiceGameInstance, GameResult } from './game/game';
import { OnDicePlayResponse } from './hooks/types';
import { useBetting } from './hooks/useBettings';
import { useGameHistory } from './hooks/useGameHistory';
import normalizeDiceDirection from './utils';

interface DiceProps {
  isGameDetailsLoading: boolean;
  isCurrencyValid: boolean;
  hasCasinoSessionId: boolean;
  isAuthenticated: boolean;
  currencyCode: string;
  balance: number;
  gameId: string;
  gameProperties: GameProperties;
  onPlay: (request: Omit<DicePlayRequest, 'casinoSessionId'>) => Promise<OnDicePlayResponse>;
  onAnimationEnd?: (correlationId: string) => void;
}

export interface GameProperties {
  currencyLimit: {
    currencyCode: string;
    minBet: number;
    maxBet: number;
    maxPayout: number;
  };
  configs: DiceGameConfig;
  type: string;
  description?: string;
}

export interface DiceFormValues extends SharedBettingFormValues {
  diceValue: string;
  direction: string;
}

function Dice({
  isGameDetailsLoading,
  isCurrencyValid,
  hasCasinoSessionId,
  isAuthenticated,
  currencyCode,
  balance,
  gameId,
  gameProperties,
  onPlay,
  onAnimationEnd,
}: DiceProps) {
  const { t } = useFallbackTranslation('internal-games');
  const {
    isHotkeysEnabled,
    setIsHotkeysEnabled,
    isSoundOn,
    setIsSoundOn,
    isMaxBetEnabled,
    setIsMaxBetEnabled,
    volume,
    setVolume,
  } = useSettings();

  const gameRef = useRef<DiceGameInstance | null>(null);
  const [isGameInProgress, setIsGameInProgress] = useState(false);

  const pendingGameResultRef = useRef<{
    betId: string;
    result: number;
    isWin: boolean;
    correlationId: string;
    diceValue: number;
    direction: string;
  } | null>(null);

  const dialog = useDialog();
  const gameHistory = useGameHistory();
  const isSoundOnRef = useRef(isSoundOn);

  useEffect(() => {
    isSoundOnRef.current = isSoundOn;
  }, [isSoundOn]);

  const handleGameCompleted = useCallback(() => {
    if (pendingGameResultRef.current) {
      const { betId, result, isWin, diceValue, direction, correlationId } = pendingGameResultRef.current;
      gameHistory.addResult(betId, result, diceValue, direction, isWin);
      onAnimationEnd?.(correlationId);
      pendingGameResultRef.current = null;
      setIsGameInProgress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGameReady = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.setMuted(!isSoundOnRef.current);
    }
  }, []);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setMuted(!isSoundOn);
    }
  }, [isSoundOn]);

  const minMultiplier = useCallback(() => {
    return gameProperties.configs.minMultiplier;
  }, [gameProperties.configs.minMultiplier]);

  const maxMultiplier = useCallback(
    () =>
      Number(
        dice_calculate_multiplier(
          normalizeDiceDirection('above'),
          gameProperties.configs.maxDiceValue,
          gameProperties.configs.edge,
        ).toFixed(4),
      ),
    [gameProperties.configs.edge, gameProperties.configs.maxDiceValue],
  );

  const minDiceValue = useMemo(() => {
    return gameProperties.configs.minDiceValue;
  }, [gameProperties.configs.minDiceValue]);

  const maxDiceValue = useMemo(() => {
    return gameProperties.configs.maxDiceValue;
  }, [gameProperties.configs.maxDiceValue]);

  const calculateMinWinChance = useMemo(() => {
    return Number(dice_calculate_chanceToWin('Above', maxDiceValue).toFixed(8));
  }, [maxDiceValue]);

  const calculateMaxWinChance = useMemo(() => {
    return Number(dice_calculate_chanceToWin('Above', minDiceValue).toFixed(8));
  }, [minDiceValue]);

  const { formatAmount } = useFiatCryptoDisplay();
  const showInFiat = useBalanceStore((state) => state.showInFiat);
  const exchangeRate = useBalanceStore((state) => state.selectedCurrency?.exchangeRates?.USD ?? 0);
  const minBetDisplay = formatAmount(gameProperties.currencyLimit.minBet);
  const maxBetDisplay = formatAmount(gameProperties.currencyLimit.maxBet);
  const maxPayoutDisplay = formatAmount(gameProperties.currencyLimit.maxPayout);

  const validationSchema = useMemo(
    () =>
      yup.object({
        bettingMode: yup.string().oneOf(['manual', 'auto']).required(),
        betAmount: yup.string().when('bettingMode', {
          is: 'manual',
          then: (schema) =>
            schema
              .typeError(t('validation.enter-amount'))
              .required(t('validation.enter-amount'))
              .test(
                'min-bet',
                t('validation.min-bet-amount', { amount: minBetDisplay }),
                (value) => Number(value) === 0 || Number(value) >= gameProperties.currencyLimit.minBet,
              )
              .test(
                'max-bet',
                t('validation.max-bet-amount', { amount: maxBetDisplay }),
                (value) => Number(value) <= gameProperties.currencyLimit.maxBet,
              )
              .test(
                'max-payout',
                t('validation.max-payout', { amount: maxPayoutDisplay }),
                (value, context) =>
                  dice_calculate_potentialProfit(Number(value), Number(context.parent.multiplier)) <=
                  gameProperties.currencyLimit.maxPayout,
              )
              .test('balance', t('validation.insufficient-balance'), (value) => {
                const betAmount = Number(value);
                const currentBalance = balance ?? 0;
                // Allow if both amount and balance are mathematically zero
                if (betAmount === 0 && currentBalance === 0) {
                  return true;
                }
                // Otherwise, check if bet amount is within balance
                return betAmount <= currentBalance;
              }),
          otherwise: (schema) => schema.notRequired(),
        }),
        autoBetAmount: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) =>
            schema
              .required(t('validation.enter-amount'))
              .test('is-number', t('validation.enter-amount'), (value) => !Number.isNaN(Number(value)))
              .test('non-negative', t('validation.enter-amount'), (value) => Number(value) >= 0)
              .test(
                'min-bet',
                t('validation.min-bet-amount', { amount: minBetDisplay }),
                (value) => Number(value) === 0 || Number(value) >= gameProperties.currencyLimit.minBet,
              )
              .test(
                'max-bet',
                t('validation.max-bet-amount', { amount: maxBetDisplay }),
                (value) => Number(value) <= gameProperties.currencyLimit.maxBet,
              )
              .test('max-payout', t('validation.max-payout', { amount: maxPayoutDisplay }), function (value, context) {
                const { multiplier } = context.parent as SharedBettingFormValues;
                return (
                  dice_calculate_potentialProfit(Number(value), Number(multiplier)) <
                  gameProperties.currencyLimit.maxPayout
                );
              })
              .test('balance', t('validation.insufficient-balance'), (value) => {
                const betAmount = Number(value);
                const currentBalance = balance ?? 0;
                // Allow if both amount and balance are mathematically zero
                if (betAmount === 0 && currentBalance === 0) {
                  return true;
                }
                // Otherwise, check if bet amount is within balance
                return betAmount <= currentBalance;
              }),
          otherwise: (schema) => schema.notRequired(),
        }),
        numberOfBets: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) =>
            schema
              .required()
              .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value)))
              .test('min-value', t('validation.enter-valid-number'), (value) => Number(value) >= 0)
              .test('is-integer', t('validation.enter-valid-number'), (value) => Number.isInteger(Number(value))),
          otherwise: (schema) => schema.notRequired(),
        }),
        onWinStrategy: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) => schema.oneOf(['reset', 'increase']).required(),
          otherwise: (schema) => schema.notRequired(),
        }),
        onWinValue: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) =>
            schema
              .required()
              .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value))),
          otherwise: (schema) => schema.notRequired(),
        }),
        onLossStrategy: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) => schema.oneOf(['reset', 'increase']).required(),
          otherwise: (schema) => schema.notRequired(),
        }),
        onLossValue: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) =>
            schema
              .required()
              .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value))),
          otherwise: (schema) => schema.notRequired(),
        }),
        stopOnProfit: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) =>
            schema
              .required()
              .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value)))
              .test('min-value', t('validation.enter-valid-number'), (value) => Number(value) >= 0),
          otherwise: (schema) => schema.notRequired(),
        }),
        stopOnLoss: yup.string().when('bettingMode', {
          is: 'auto',
          then: (schema) =>
            schema
              .required()
              .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value)))
              .test('min-value', t('validation.enter-valid-number'), (value) => Number(value) >= 0),
          otherwise: (schema) => schema.notRequired(),
        }),

        multiplier: yup
          .string()
          .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value)))
          .test('non-negative', t('validation.enter-valid-number'), (value) => Number(value) >= 0)
          .test(
            'max-value',
            t('validation.max-value-is', {
              value: maxMultiplier(),
            }),
            (value) => Number(value) <= maxMultiplier(),
          )
          .test(
            'min-value',
            t('validation.min-value-is', {
              value: minMultiplier(),
            }),
            (value) => Number(value) >= minMultiplier(),
          ),

        diceValue: yup
          .string()
          .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value)))
          .test(
            'min-value',
            t('validation.min-value-is', {
              value: minDiceValue,
            }),
            (value) => Number(value) >= minDiceValue,
          )
          .test(
            'max-value',
            t('validation.max-value-is', {
              value: maxDiceValue,
            }),
            (value) => Number(value) <= maxDiceValue,
          )
          .required(),

        winChance: yup
          .string()
          .test('is-number', t('validation.enter-valid-number'), (value) => !Number.isNaN(Number(value)))
          .test('non-negative', t('validation.enter-valid-number'), (value) => Number(value) >= 0)
          .test('max-value', '', function (value, context) {
            return (
              Number(value) <= calculateMaxWinChance ||
              context.createError({
                message: t('validation.max-value-is', { value: calculateMaxWinChance }),
              })
            );
          })
          .test('min-value', '', function (value, context) {
            return (
              Number(value) >= calculateMinWinChance ||
              context.createError({
                message: t('validation.min-value-is', { value: calculateMinWinChance }),
              })
            );
          }),

        direction: yup.string().oneOf(['above', 'under']).required(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      balance,
      gameProperties.currencyLimit.maxBet,
      gameProperties.currencyLimit.maxPayout,
      gameProperties.currencyLimit.minBet,
      gameProperties.configs.edge,
      gameProperties.configs.minMultiplier,
      gameProperties.configs.minDiceValue,
      gameProperties.configs.maxDiceValue,
      minBetDisplay,
      maxBetDisplay,
      maxPayoutDisplay,
      showInFiat,
      exchangeRate,
      t,
    ],
  );

  const startDiceValue = 50.0;

  const formik = useFormik<DiceFormValues>({
    initialValues: {
      bettingMode: 'manual',
      betAmount: (0).toFixed(CRYPTO_DECIMAL_PLACES),
      autoBetAmount: (0).toFixed(CRYPTO_DECIMAL_PLACES),
      numberOfBets: '0',
      onWinStrategy: 'reset',
      onWinValue: '0',
      onLossStrategy: 'reset',
      onLossValue: '0',
      stopOnProfit: (0).toFixed(CRYPTO_DECIMAL_PLACES),
      stopOnLoss: (0).toFixed(CRYPTO_DECIMAL_PLACES),
      multiplier: dice_calculate_multiplier(
        normalizeDiceDirection('above'),
        startDiceValue,
        gameProperties.configs.edge,
      ).toFixed(2),
      winChance: dice_calculate_chanceToWin(normalizeDiceDirection('above'), startDiceValue).toFixed(8),
      diceValue: startDiceValue.toFixed(2),
      direction: 'above',
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      if (formik.values.bettingMode === 'manual') {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleBet(Number(values.betAmount));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        handleAutoBet(values);
      }
    },
  });

  const playGame = useCallback(
    async (
      betId: string,
      isWin: boolean,
      result: number,
      correlationId: string,
      diceValue: number,
      direction: string,
      onComplete: () => void,
    ) => {
      handleGameCompleted();

      try {
        const gameResult: GameResult = {
          result,
          isWin,
          diceValue,
          direction,
          correlationId,
        };

        setIsGameInProgress(true);

        pendingGameResultRef.current = {
          betId,
          result,
          isWin,
          correlationId,
          diceValue,
          direction,
        };

        gameRef.current?.roll(gameResult);

        onComplete();
      } catch (error) {
        console.error('Error playing game:', error);
        await dialog.showDialog(`Error playing game. Please try again. ${error instanceof Error ? error.message : ''}`);
        onComplete();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const betting = useBetting({
    onPlay: async (request: Omit<DicePlayRequest, 'casinoSessionId'>) => {
      const response = await onPlay(request);
      return response;
    },
    play: playGame,
    gameId,
    currencyCode,
    diceValue: Number(formik.values.diceValue),
    direction: formik.values.direction,
  });

  const handleBet = async (betAmount: number) => {
    try {
      if (gameRef.current) {
        gameRef.current.playStartSound();
      }
      await betting.manualBet(betAmount);
    } catch (error) {
      if (isAuthenticated) {
        await dialog.showDialog(`Error placing bet. Please try again. ${error instanceof Error ? error.message : ''}`);
      }
    }
  };

  const handleAutoBet = async (values: AutoBettingValues) => {
    try {
      await betting.startAutoBet({
        autoBetAmount: Number(values.autoBetAmount),
        numberOfBets: Number(values.numberOfBets),
        onWinStrategy: { type: values.onWinStrategy, value: Number(values.onWinValue) },
        onLossStrategy: { type: values.onLossStrategy, value: Number(values.onLossValue) },
        stopOnProfit: Number(values.stopOnProfit),
        stopOnLoss: Number(values.stopOnLoss),
        onWinValue: Number(values.onWinValue),
        onLossValue: Number(values.onLossValue),
        multiplier: Number(values.multiplier),
      });
    } catch (error) {
      if (isAuthenticated) {
        await dialog.showDialog(`Error placing bet. Please try again. ${error instanceof Error ? error.message : ''}`);
      }
      console.error(error);
    }
  };

  const handleSliderValueChange = useCallback(
    (value: number) => {
      const formattedValue = value.toFixed(2);
      formik.setValues(
        {
          ...formik.values,
          multiplier: dice_calculate_multiplier(
            normalizeDiceDirection(formik.values.direction),
            Number(formattedValue),
            gameProperties.configs.edge,
          ).toFixed(4),
          diceValue: formattedValue,
          winChance: dice_calculate_chanceToWin(normalizeDiceDirection(formik.values.direction), Number(formattedValue))
            .toFixed(8)
            .toString(),
        },
        true,
      );
    },
    [formik, gameProperties.configs.edge],
  );

  const { validateForm } = formik;

  useEffect(() => {
    if (!isAuthenticated) {
      betting.stopAutoBet();
      dialog.handleDialogClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when auth changes to reset auto-bet
  }, [isAuthenticated]);

  useEffect(() => {
    validateForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    balance,
    gameProperties.currencyLimit.maxBet,
    gameProperties.currencyLimit.maxPayout,
    gameProperties.currencyLimit.minBet,
    gameProperties.configs.edge,
    gameProperties.configs.minMultiplier,
    gameProperties.configs.minDiceValue,
    gameProperties.configs.maxDiceValue,
    showInFiat,
    exchangeRate,
    t,
  ]);

  return (
    <Box className="flex size-full flex-col">
      <Box className="relative w-full overflow-hidden group-fullscreen:h-full">
        <Box className="flex h-full flex-col-reverse gap-1 group-fullscreen:h-full desktop:h-[640px] desktop:flex-row desktop:gap-0">
          <BettingPanel
            disabled={betting.autoBetRunning || betting.isLoading}
            manualBettingPanel={
              <ManualBettingPanel
                active={false}
                isLoading={betting.isLoading || isGameDetailsLoading}
                isCurrencyValid={isCurrencyValid}
                hasCasinoSessionId={hasCasinoSessionId}
                gameProperties={gameProperties}
                currencyCode={currencyCode}
                balance={balance}
                isHotkeysEnabled={isHotkeysEnabled}
                isMaxBetEnabled={isMaxBetEnabled}
                useBetAmountHook={useBetAmount}
                formik={formik}
              />
            }
            autoBettingPanel={
              <AutoBettingPanel
                active={false}
                isLoading={betting.isLoading || betting.autoBetRunning || isGameDetailsLoading}
                isCurrencyValid={isCurrencyValid}
                hasCasinoSessionId={hasCasinoSessionId}
                isAuthenticated={isAuthenticated}
                currencyCode={currencyCode}
                gameProperties={gameProperties}
                onStopAutoBet={betting.stopAutoBet}
                autoBetRunning={betting.isAutoBetRunning}
                autoBetAmount={betting.autoBetAmount}
                balance={balance}
                isHotkeysEnabled={isHotkeysEnabled}
                isMaxBetEnabled={isMaxBetEnabled}
                useBetAmountHook={useBetAmount}
                formik={formik}
              />
            }
          />

          <Box className="relative h-full max-h-[500px] min-h-[400px] overflow-hidden shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14)] desktop:max-h-none desktop:flex-1 desktop:rounded-tr-[12px]">
            <Box className="absolute right-4 top-4 z-10 flex gap-2">
              <HistoryDisplay history={gameHistory.history} />
            </Box>

            <GameDisplay
              gameRef={gameRef}
              onGameReady={handleGameReady}
              onAnimationEnd={handleGameCompleted}
              targetDiceValue={Number(formik.values.diceValue)}
              direction={formik.values.direction}
              isGameInProgress={isGameInProgress}
              isSoundOn={isSoundOn}
              volume={volume}
              minDiceValue={minDiceValue}
              maxDiceValue={maxDiceValue}
              onSliderValueChange={handleSliderValueChange}
            />

            <GameBottomControls
              edge={gameProperties.configs.edge}
              isHotkeysEnabled={isHotkeysEnabled}
              formik={formik}
              disabled={betting.isLoading || isGameDetailsLoading || betting.autoBetRunning}
            />
          </Box>
        </Box>
      </Box>
      <GameFooter
        gameTitle={t('dice.title')}
        edge={gameProperties.configs.edge}
        isHotkeysEnabled={isHotkeysEnabled}
        setIsHotkeysEnabled={setIsHotkeysEnabled}
        isSoundOn={isSoundOn}
        setIsSoundOn={setIsSoundOn}
        volume={volume}
        onVolumeChange={setVolume}
        isMaxBetEnabled={isMaxBetEnabled}
        setIsMaxBetEnabled={setIsMaxBetEnabled}
        gameDescription={gameProperties.description}
      />
      <Dialog open={dialog.dialogOpen} onClose={dialog.handleDialogClose} disablePortal>
        <DialogTitle className="text-white">{t('game-notification')}</DialogTitle>
        <DialogContent className="pt-2 text-gray-200">
          <Typography>{dialog.dialogMessage}</Typography>
        </DialogContent>
        <DialogActions className="pt-2">
          <Button onClick={dialog.handleDialogClose} variant="contained" className="bg-[#91CBF6] hover:bg-[#7ab8f0]">
            {t('ok')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default memo(Dice);
