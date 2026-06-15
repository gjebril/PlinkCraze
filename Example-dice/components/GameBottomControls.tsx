import {
  dice_calculate_chanceToWin,
  dice_calculate_multiplier,
  dice_calculate_targetValue,
} from '@bet-technology/inhousegames-jsclient/dist/dice';
import { Box, Button, InputAdornment } from '@mui/material';
import type { FormikProps } from 'formik';
import useFallbackTranslation from 'hooks/useFallbackTranslation';
import { useHotkeys } from 'react-hotkeys-hook';
import { CrazeControlIcon } from 'shared/components/CrazeIcon';
import CrazeTooltip from 'shared/components/CrazeTooltip/CrazeTooltip';
import PanelTextField from '../../shared/components/panels/PanelTextField';
import type { DiceFormValues } from '../Dice';
import normalizeDiceDirection from '../utils';

interface GameBottomControlsProps {
  edge: number;
  isHotkeysEnabled: boolean;
  formik: FormikProps<DiceFormValues>;
  disabled?: boolean;
}

function GameBottomControls({ edge, isHotkeysEnabled, formik, disabled = false }: GameBottomControlsProps) {
  const { values, setValues, setFieldValue, errors } = formik;
  const { t } = useFallbackTranslation('internal-games');

  const cleanValue = (value: string) => {
    const filteredValue = value.replace(/[^0-9.]/g, '');
    const parts = filteredValue.split('.');
    const finalValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filteredValue;
    return finalValue;
  };

  const handleMultiplierChange = (value: string) => {
    const cleanedValue = cleanValue(value);
    const diceValue = dice_calculate_targetValue(normalizeDiceDirection(values.direction), Number(cleanedValue), edge);
    const winChance = dice_calculate_chanceToWin(normalizeDiceDirection(values.direction), diceValue);

    setValues(
      {
        ...values,
        multiplier: cleanedValue,
        diceValue: diceValue.toFixed(2),
        winChance: winChance.toFixed(8),
      },
      true,
    );
  };

  const handleMultiplierBlur = () => {
    const numValue = Number(values.multiplier).toFixed(4);
    setFieldValue('multiplier', numValue);
    handleMultiplierChange(numValue);
  };

  const handleDiceValueChange = (value: string) => {
    const cleanedValue = cleanValue(value);
    setValues(
      {
        ...values,
        multiplier: dice_calculate_multiplier(
          normalizeDiceDirection(values.direction),
          Number(cleanedValue),
          edge,
        ).toFixed(4),
        diceValue: cleanedValue,
        winChance: dice_calculate_chanceToWin(normalizeDiceDirection(values.direction), Number(cleanedValue)).toFixed(
          8,
        ),
      },
      true,
    );
  };

  const handleDiceValueBlur = () => {
    const numValue = Number(values.diceValue).toFixed(2);
    setFieldValue('diceValue', numValue);
    handleDiceValueChange(numValue);
  };

  const handleDirectionChange = () => {
    const newDirection = values.direction.toLowerCase() === 'above' ? 'under' : 'above';
    const currentDiceValue = Number(values.diceValue);
    const invertedDiceValue = Number(100 - currentDiceValue);

    setValues(
      {
        ...values,
        multiplier: dice_calculate_multiplier(
          normalizeDiceDirection(values.direction),
          Number(values.diceValue),
          edge,
        ).toFixed(4),
        diceValue: invertedDiceValue.toFixed(2),
        winChance: dice_calculate_chanceToWin(normalizeDiceDirection(newDirection), invertedDiceValue).toFixed(8),
        direction: newDirection,
      },
      true,
    );
  };

  const handleWinChanceChange = (value: string) => {
    const winChanceValuee = cleanValue(value);
    const multiplier = (100 - edge) / Number(winChanceValuee);
    const targetDiceValue = dice_calculate_targetValue(
      normalizeDiceDirection(values.direction),
      Number(multiplier),
      edge,
    );
    const recalculatedWinChance = dice_calculate_chanceToWin(
      normalizeDiceDirection(values.direction),
      Number(targetDiceValue),
    );

    setValues(
      {
        ...values,
        multiplier: multiplier.toFixed(4),
        diceValue: targetDiceValue.toFixed(2),
        winChance: recalculatedWinChance.toFixed(8),
      },
      true,
    );
  };

  const handleWinChanceBlur = () => {
    const numValue = Number(values.winChance).toFixed(8);
    setFieldValue('winChance', numValue);
    handleWinChanceChange(numValue);
  };

  useHotkeys(
    'w',
    () => {
      const newValue = Math.min(100, Number(values.diceValue) + 1).toFixed(2);
      handleDiceValueChange(newValue);
    },
    {
      enabled: isHotkeysEnabled,
      preventDefault: true,
    },
  );

  useHotkeys(
    'e',
    () => {
      const newValue = Math.max(0, Number(values.diceValue) - 1).toFixed(2);
      handleDiceValueChange(newValue);
    },
    {
      enabled: isHotkeysEnabled,
      preventDefault: true,
    },
  );

  useHotkeys(
    'q',
    () => {
      handleDirectionChange();
    },
    {
      enabled: isHotkeysEnabled,
      preventDefault: true,
    },
  );

  return (
    <Box className="absolute inset-x-4 bottom-4 rounded p-2 dark:bg-[rgb(255_255_255_/_0.05)]">
      <Box className="flex gap-2 desktop:gap-4">
        {/* Multiplier Field */}
        <CrazeTooltip
          title={errors.multiplier ?? ''}
          variant="error"
          open={Boolean(errors.multiplier)}
          disableInteractive
          disableFocusListener
          disableHoverListener
          disableTouchListener>
          <div className="flex-1">
            <PanelTextField
              controlButtons
              className="flex-1"
              label={t('betting.multiplier')}
              value={values.multiplier}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMultiplierChange(e.target.value)}
              onBlur={handleMultiplierBlur}
              disabled={disabled}
              onControlButtonIncrease={() => {
                const currentMultiplier = parseFloat(values.multiplier || '0');
                handleMultiplierChange((currentMultiplier + 0.01).toFixed(4));
              }}
              onControlButtonDecrease={() => {
                const currentMultiplier = parseFloat(values.multiplier || '0');
                handleMultiplierChange((currentMultiplier - 0.01).toFixed(4));
              }}
              startAdornment={
                <InputAdornment position="start" className="mr-0">
                  <CrazeControlIcon name="close" className="text-base" />
                </InputAdornment>
              }
            />
          </div>
        </CrazeTooltip>
        {/* Roll Over Field with Switch */}
        <CrazeTooltip
          title={errors.diceValue ?? ''}
          variant="error"
          open={Boolean(errors.diceValue)}
          disableInteractive
          disableFocusListener
          disableHoverListener
          disableTouchListener>
          <div className="flex-1">
            <PanelTextField
              className="flex-1"
              label={t(values.direction === 'under' ? 'dice.betting.roll-under' : 'dice.betting.roll-over')}
              value={values.diceValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDiceValueChange(e.target.value)}
              onBlur={handleDiceValueBlur}
              disabled={disabled}
              endAdornment={
                <InputAdornment position="end" className="p-[5px]">
                  <Button
                    size="small"
                    onClick={handleDirectionChange}
                    className="h-[20px] min-w-[20px] p-0 dark:bg-[#263238] dark:text-white/70 hover:dark:bg-[#525252] hover:dark:text-white"
                    sx={{
                      borderRadius: '4px',
                      textTransform: 'none',
                    }}>
                    <CrazeControlIcon name="swapIcon" sx={{ fontSize: 15 }} />
                  </Button>
                </InputAdornment>
              }
            />
          </div>
        </CrazeTooltip>

        {/* Win Chance Field */}
        <CrazeTooltip
          title={errors.winChance ?? ''}
          variant="error"
          open={Boolean(errors.winChance)}
          disableInteractive
          disableFocusListener
          disableHoverListener
          disableTouchListener>
          <div className="flex-1">
            <PanelTextField
              controlButtons
              className="flex-1"
              label={t('betting.win-chance')}
              value={values.winChance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWinChanceChange(e.target.value)}
              onBlur={handleWinChanceBlur}
              disabled={disabled}
              startAdornment={
                <InputAdornment className="mr-0 dark:text-white/30" position="start">
                  <CrazeControlIcon name="percent" className="text-base" />
                </InputAdornment>
              }
              onControlButtonIncrease={() => {
                const currentWinChance = parseFloat(values.winChance || '0');
                handleWinChanceChange((currentWinChance + 0.1).toFixed(8));
              }}
              onControlButtonDecrease={() => {
                const currentWinChance = parseFloat(values.winChance || '0');
                handleWinChanceChange((currentWinChance - 0.1).toFixed(8));
              }}
            />
          </div>
        </CrazeTooltip>
      </Box>
    </Box>
  );
}

export default GameBottomControls;
