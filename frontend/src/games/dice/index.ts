import type { GameEntry } from '../types';
import DiceWrapper from './DiceWrapper';

export const dice: GameEntry = {
  id: 'dice',
  name: 'Dice',
  path: '/dice',
  Component: DiceWrapper,
};

export type { DiceGame, DiceGameCallbacks } from './game/game';
