// Dice scene — ported from the reference dice game (graphics-based slider).
// No outcome table, so these values are purely cosmetic and safe to tune.
export const WIDTH = 900;
export const HEIGHT = 320;

// Draggable target range (matches the reference clamp).
export const MIN_VALUE = 2;
export const MAX_VALUE = 98;

export const COLORS = {
  BACKGROUND: '#20262E',
  BORDER: 0x37474f,
  GAP: 0x20262e,
  SLIDER_BG: 0x3e4b5b,
  THUMB: 0x00d1e0,
  THUMB_LINE: 0x007777,
  TICK: 0x20262e,
  RED_TOP: 0xff3490,
  RED_BOTTOM: 0xad0743,
  GREEN_TOP: 0x2fff2b,
  GREEN_BOTTOM: 0x008b05,
  INDICATOR: 0x00d1e0,
};

// Slider geometry (reference NORMAL_VIEW_BASE proportions).
export const SLIDER = {
  HEIGHT: 16,
  RADIUS: 6,
  OUTER_RADIUS: 36,
  GAP: 16,
  BORDER: 14,
  MARGIN_PCT: 0.1,
  Y: 160, // top of the slider bar
  TICK_WIDTH: 4,
  TICK_HEIGHT: 12,
  THUMB_LINE_WIDTH: 18,
};

export const SLIDER_LABELS = [0, 25, 50, 75, 100];

export const LABEL_FONT = '600 22px Poppins, sans-serif';
export const INDICATOR_FONT = '700 22px Poppins, sans-serif';
