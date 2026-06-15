import type { DiceDirection } from './gameLogic';

/** House edge as a percentage. TODO: fetch from GameManagement currency-limits. */
export const HOUSE_EDGE = 1;

/** Win chance (%) for a target/direction. */
export function winChance(userValue: number, direction: DiceDirection): number {
  return direction === 'Above' ? 100 - userValue : userValue;
}

/** Payout multiplier for a target/direction. */
export function multiplier(userValue: number, direction: DiceDirection): number {
  const chance = winChance(userValue, direction);
  return chance > 0 ? (100 - HOUSE_EDGE) / chance : 0;
}
