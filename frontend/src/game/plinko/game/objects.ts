import {
  HEIGHT,
  LAST_PEG_ROW,
  NUM_SINKS,
  PEG_ROW_END,
  PEG_ROW_START,
  PEG_SPACING_X,
  PEG_SPACING_Y,
  SINK_MULTIPLIERS,
  WIDTH,
  obstacleRadius,
  sinkWidth,
} from './constants';
import { pad } from './padding';

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
}

export interface Sink {
  x: number;
  y: number;
  width: number;
  height: number;
  multiplier: number;
}

/** X position of peg `col` in a given row (screen space, unpadded). */
export const pegX = (row: number, col: number): number => WIDTH / 2 - PEG_SPACING_X * (row / 2 - col);

/** X position of peg `i` in the bottom row. */
export const lastRowPegX = (i: number): number => pegX(LAST_PEG_ROW, i);

/** Center X of bin `i` = midpoint between bottom-row pegs i and i+1. */
export const binCenterX = (i: number): number => (lastRowPegX(i) + lastRowPegX(i + 1)) / 2;

// Triangular peg grid — identical layout to the original engine so the
// predetermined start positions in outcomes.json still resolve correctly.
export const createObstacles = (): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  for (let row = PEG_ROW_START; row < PEG_ROW_END; row++) {
    const numObstacles = row + 1;
    const y = row * PEG_SPACING_Y;
    for (let col = 0; col < numObstacles; col++) {
      obstacles.push({ x: pad(pegX(row, col)), y: pad(y), radius: obstacleRadius });
    }
  }
  return obstacles;
};

// Collision sinks — legacy geometry preserved exactly (see constants note).
export const createSinks = (): Sink[] => {
  const sinks: Sink[] = [];
  const SPACING = obstacleRadius * 2;

  for (let i = 0; i < NUM_SINKS; i++) {
    const x = WIDTH / 2 + sinkWidth * (i - Math.floor(NUM_SINKS / 2)) - SPACING * 1.5;
    const y = HEIGHT - 170;
    const width = sinkWidth;
    const height = width;
    sinks.push({ x, y, width, height, multiplier: SINK_MULTIPLIERS[i + 1] });
  }

  return sinks;
};
