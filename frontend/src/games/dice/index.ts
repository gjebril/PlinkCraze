import type { GameEntry } from '../types';
import DiceWrapper from './DiceWrapper';
import Thumbnail from './Thumbnail';

export const dice: GameEntry = {
  id: 'dice',
  name: 'Dice',
  path: '/dice',
  Component: DiceWrapper,
  tagline: 'Pick a number, beat the roll.',
  accent: '#00E701',
  status: 'wip',
  Thumbnail,
};

export type { DiceGame, DiceGameCallbacks } from './game/game';
