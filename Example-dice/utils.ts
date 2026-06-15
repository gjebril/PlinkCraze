/**
 * Normalizes direction string to match library requirements
 * Converts 'above'/'under' to 'Above'/'Under'
 * @param direction - Direction string ('above', 'under', 'Above', 'Under')
 * @returns Normalized direction ('Above' or 'Under')
 */
export default function normalizeDiceDirection(direction: string): 'Above' | 'Under' {
  return direction.toLowerCase() === 'above' ? 'Above' : 'Under';
}
