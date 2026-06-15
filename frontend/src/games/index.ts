import { dice } from './dice';
import { plinko } from './plinko';
import type { GameEntry } from './types';

/** All games in the collection. Add new games here. */
export const GAMES: GameEntry[] = [plinko, dice];

export type { GameEntry };
