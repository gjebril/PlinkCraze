import { pad } from './padding';

// ── Board dimensions ────────────────────────────────────────────────────────
// The board is authored at a fixed logical size; Phaser scales it responsively.
export const WIDTH = 800;
export const HEIGHT = 800;

export const ballRadius = 7;
export const obstacleRadius = 4;

// ── Physics (ported verbatim from the original canvas engine) ────────────────
// outcomes.json was generated against these exact values — do NOT tune them
// or the predetermined start positions will land in the wrong sinks.
export const gravity = pad(0.6);
export const horizontalFriction = 0.4;
export const verticalFriction = 0.8;

// ── Sinks ────────────────────────────────────────────────────────────────────
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

// ── Colors ───────────────────────────────────────────────────────────────────
export const COLORS = {
  BACKGROUND: '#0f212e',
  OBSTACLE: 0xa9cde2,
  BALL_CENTER: 0xffff00,
  BALL_EDGE: 0xffff00,
  SINK_BORDER: 0x000000,
  RIPPLE: 0xffffff,
};

// Multiplier → color gradient stops (low payout = yellow, high = deep red).
export const COLOR_STOPS = [
  { value: 0.5, color: { r: 255, g: 255, b: 153 } },
  { value: 1.0, color: { r: 255, g: 255, b: 0 } },
  { value: 1.1, color: { r: 255, g: 204, b: 0 } },
  { value: 1.2, color: { r: 255, g: 153, b: 0 } },
  { value: 1.4, color: { r: 255, g: 102, b: 0 } },
  { value: 2.0, color: { r: 255, g: 51, b: 0 } },
  { value: 9.0, color: { r: 255, g: 0, b: 0 } },
  { value: 16.0, color: { r: 204, g: 0, b: 0 } },
] as const;

// ── Animation tuning ──────────────────────────────────────────────────────────
export const RIPPLE_DURATION = 800;
export const RIPPLE_MAX_RADIUS = 15;
export const SINK_SHAKE_DURATION = 200;
export const SINK_SHAKE_INTENSITY = 5;

export type PlinkoViewMode = 'normal' | 'mobile';
