import { COLOR_STOPS } from './game/constants';

export interface MultiplierColor {
  /** Phaser-friendly numeric color, e.g. 0xff0000. */
  fill: number;
  /** CSS color string, e.g. 'rgb(255, 0, 0)'. */
  css: string;
  /** Readable text color for labels drawn on top of `fill`. */
  text: string;
}

/**
 * Maps a payout multiplier to a color along the yellow → red gradient,
 * mirroring the original engine's `getColor`.
 */
export function getMultiplierColor(multiplier: number): MultiplierColor {
  type Stop = (typeof COLOR_STOPS)[number];
  let startColor: Stop = COLOR_STOPS[0];
  let endColor: Stop = COLOR_STOPS[COLOR_STOPS.length - 1];

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (multiplier >= COLOR_STOPS[i].value && multiplier <= COLOR_STOPS[i + 1].value) {
      startColor = COLOR_STOPS[i];
      endColor = COLOR_STOPS[i + 1];
      break;
    }
  }

  const range = endColor.value - startColor.value;
  const progress = range === 0 ? 0 : (multiplier - startColor.value) / range;

  const r = Math.round(startColor.color.r + (endColor.color.r - startColor.color.r) * progress);
  const g = Math.round(startColor.color.g + (endColor.color.g - startColor.color.g) * progress);
  const b = Math.round(startColor.color.b + (endColor.color.b - startColor.color.b) * progress);

  return {
    fill: (r << 16) | (g << 8) | b,
    css: `rgb(${r}, ${g}, ${b})`,
    text: multiplier === 16 ? '#ffffff' : '#000000',
  };
}
