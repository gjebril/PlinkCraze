import { pad } from './padding';

// ── Board dimensions ────────────────────────────────────────────────────────
export const WIDTH = 800;
export const HEIGHT = 800;

export const ballRadius = 7;
export const obstacleRadius = 4;

// ── Peg layout (single source of truth for the pyramid) ──────────────────────
export const PEG_SPACING_X = 36;
export const PEG_SPACING_Y = 35;
export const PEG_ROW_START = 2; // first drawn row index
export const PEG_ROW_END = 18; // exclusive
export const LAST_PEG_ROW = PEG_ROW_END - 1; // 17
export const LAST_ROW_PEG_COUNT = LAST_PEG_ROW + 1; // 18 pegs in the bottom row
export const LAST_PEG_ROW_Y = LAST_PEG_ROW * PEG_SPACING_Y; // 595

export const PEG_DRAW_RADIUS = PEG_SPACING_X * 0.13; // ≈ 4.7
export const BALL_DRAW_RADIUS = PEG_DRAW_RADIUS * 1.6; // ≈ 7.5

// ── Bin layout (derived from the pegs so it can never drift) ──────────────────
export const BIN_GAP = 4;
export const BIN_COUNT = LAST_ROW_PEG_COUNT - 1; // 17 bins under the 17 gaps
export const BIN_WIDTH = PEG_SPACING_X - BIN_GAP; // 32
export const BIN_HEIGHT = BIN_WIDTH * 0.85; // ≈ 27.2 (near-square)
export const BIN_ROW_Y = LAST_PEG_ROW_Y + PEG_SPACING_Y * 0.7; // 619.5
export const BIN_CORNER_RADIUS = 4;
export const BIN_BOTTOM_EDGE = 3; // darker slab lip at the bottom
export const BIN_TEXT_COLOR = '#1C2127';
export const BIN_LABEL_FONT = `600 ${Math.round(BIN_WIDTH * 0.38)}px Poppins, sans-serif`;

// ── Collision sinks (legacy geometry — DO NOT change: outcomes.json is keyed
//    to these exact ranges; re-aligning them breaks the imitation) ────────────
export const sinkWidth = 36;
export const NUM_SINKS = 17;

// Multipliers per sink, left → right (1-indexed to match the original engine).
export const SINK_MULTIPLIERS: { [key: number]: number } = {
  1: 16,
  2: 9,
  3: 2,
  4: 1.4,
  5: 1.4,
  6: 1.2,
  7: 1.1,
  8: 1,
  9: 0.5,
  10: 1,
  11: 1.1,
  12: 1.2,
  13: 1.4,
  14: 1.4,
  15: 2,
  16: 9,
  17: 16,
};

// ── Physics (ported verbatim — outcomes.json depends on these) ───────────────
export const gravity = pad(0.6);
export const horizontalFriction = 0.4;
export const verticalFriction = 0.8;

// ── Colors ───────────────────────────────────────────────────────────────────
export const COLORS = {
  BACKGROUND: '#20262E',
  OBSTACLE: 0x9ca3ab,
  BALL_FILL: 0xff2d7e,
  RIPPLE: 0xffffff,
};

// Bin palette indexed by distance from the center bin (0 = center … 8 = edge):
// pale yellow → bright yellow → amber → orange → hot pink → dark crimson.
export const BIN_PALETTE = [
  '#FAFFC8', // 0 center
  '#F2F986', // 1
  '#F7F000', // 2
  '#D4B100', // 3
  '#FFAA3C', // 4
  '#F57D00', // 5
  '#F2256E', // 6
  '#DC1257', // 7
  '#A50D3F', // 8 edge
] as const;

// ── Animation tuning ──────────────────────────────────────────────────────────
export const RIPPLE_DURATION = 800;
export const RIPPLE_MAX_RADIUS = 15;
export const SINK_SHAKE_DURATION = 200;
export const SINK_SHAKE_INTENSITY = 5;
