import type { GameEntry } from '../types';
import PlinkoWrapper from './PlinkoWrapper';
import Simulation from './Simulation';
import Thumbnail from './Thumbnail';

export const plinko: GameEntry = {
  id: 'plinko',
  name: 'Plinko',
  path: '/plinko',
  Component: PlinkoWrapper,
  Simulation,
  tagline: 'Drop the ball, chase the multiplier.',
  accent: '#FF2D7E',
  status: 'ready',
  Thumbnail,
};

export type { PlinkoGame, PlinkoGameCallbacks } from './game/game';
