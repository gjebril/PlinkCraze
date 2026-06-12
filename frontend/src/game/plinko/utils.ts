import { BIN_COUNT, BIN_PALETTE } from './game/constants';

export interface BinColor {
  /** CSS hex, e.g. '#FFAA3C'. */
  css: string;
  /** Phaser numeric color, e.g. 0xffaa3c. */
  fill: number;
  /** ~25% darker variant for the bottom-edge slab. */
  darkCss: string;
  darkFill: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/**
 * Bin color by distance from the center bin (NOT by multiplier value), so the
 * yellow-center → crimson-edge gradient holds for any row count.
 */
export function getBinColor(index: number, binCount: number = BIN_COUNT): BinColor {
  const center = Math.floor(binCount / 2);
  const distance = Math.min(Math.abs(index - center), BIN_PALETTE.length - 1);
  const hex = BIN_PALETTE[distance];
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.round(r * 0.75);
  const dg = Math.round(g * 0.75);
  const db = Math.round(b * 0.75);

  return {
    css: hex,
    fill: (r << 16) | (g << 8) | b,
    darkCss: `rgb(${dr}, ${dg}, ${db})`,
    darkFill: (dr << 16) | (dg << 8) | db,
  };
}

/**
 * Multiplier label: always one decimal with an "x" suffix (7.0x, 4.7x, 0.4x),
 * except values ≥ 1000 which render as a plain integer (e.g. "1000").
 */
export function formatMultiplier(multiplier: number): string {
  return multiplier >= 1000 ? String(Math.round(multiplier)) : `${multiplier.toFixed(1)}x`;
}
