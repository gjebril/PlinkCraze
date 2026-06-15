import type { GameEntry } from '../types';
import PlinkoWrapper from './PlinkoWrapper';
import Simulation from './Simulation';

export const plinko: GameEntry = {
  id: 'plinko',
  name: 'Plinko',
  path: '/plinko',
  Component: PlinkoWrapper,
  Simulation,
};

export type { PlinkoGame, PlinkoGameCallbacks } from './game/game';
