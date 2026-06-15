import type { ComponentType } from 'react';

/**
 * A self-contained game registered in the collection. To add a game, create
 * `src/games/<game>/` exporting one of these and add it to `games/index.ts`.
 */
export interface GameEntry {
  /** URL-safe id, e.g. "plinko". */
  id: string;
  /** Display name shown in the menu. */
  name: string;
  /** Route path, e.g. "/plinko". */
  path: string;
  /** The playable game (its integration wrapper). */
  Component: ComponentType;
  /** Optional dev tool, mounted at `${path}/simulation`. */
  Simulation?: ComponentType;
  /** Short line shown on the menu card. */
  tagline?: string;
  /** Accent color (hex) for the menu card. */
  accent?: string;
  /** Readiness badge: a finished game vs. a work-in-progress scaffold. */
  status?: 'ready' | 'wip';
  /** Small SVG preview rendered on the menu card. */
  Thumbnail?: ComponentType;
}
