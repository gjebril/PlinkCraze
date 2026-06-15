import axios from 'axios';

export type DiceDirection = 'Above' | 'Under';

export interface DiceResult {
  betId: string;
  amount: number;
  payout: number;
  /** Target the player chose (0–100). */
  userValue: number;
  /** Rolled value (0–100). */
  resultValue: number;
  direction: DiceDirection;
  isWin: boolean;
}

// External InhouseGames API config (same host/key as Plinko).
const API_BASE = 'http://4.237.228.146:7575/api';
const USER_ID = 'GabyPlinkoMaster';
const API_HEADERS = {
  accept: 'text/plain',
  'X-API-Key': '1234',
  'Content-Type': 'application/json',
};

const callRoll = (amount: number, userValue: number, direction: DiceDirection) =>
  axios.post(
    `${API_BASE}/Dice/Roll`,
    { userId: USER_ID, amount, userValue, currency: 'USDT', direction },
    { headers: API_HEADERS },
  );

// See gameLogic.ts in the plinko game — the API requires an active seed per user.
const createInitialSeed = () =>
  axios.post(`${API_BASE}/Seeds/CreateInitialGameSeed`, { userId: USER_ID }, { headers: API_HEADERS });

/** Roll the dice against `userValue` in the given direction. */
export const rollDice = async (
  amount: number,
  userValue: number,
  direction: DiceDirection,
): Promise<DiceResult> => {
  try {
    let response = await callRoll(amount, userValue, direction);

    // Self-heal: create an initial seed and retry once if none is active.
    if (!response.data?.success && response.data?.errorType === 'NoActiveSeed') {
      console.warn('No active seed for user — creating initial seed and retrying.');
      await createInitialSeed();
      response = await callRoll(amount, userValue, direction);
    }

    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Roll request was not successful.');
    }

    const data = response.data.data as Omit<DiceResult, 'isWin'>;
    const isWin = direction === 'Above' ? data.resultValue > data.userValue : data.resultValue < data.userValue;
    return { ...data, isWin };
  } catch (error) {
    const details = axios.isAxiosError(error) ? (error.response?.data ?? error.message) : error;
    console.error('Error calling Dice API:', details);
    throw new Error('Failed to roll dice via external API.');
  }
};
