// Fixed-point helpers used by the physics simulation.
// Positions are scaled up by DECIMAL_MULTIPLIER internally so collision math
// stays in integer-ish space, then scaled back down for rendering.
export const DECIMAL_MULTIPLIER = 10000;

export function pad(n: number): number {
  return n * DECIMAL_MULTIPLIER;
}

export function unpad(n: number): number {
  return Math.floor(n / DECIMAL_MULTIPLIER);
}
