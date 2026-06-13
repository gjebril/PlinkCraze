import axios from 'axios';
import outcomesData from './outcomes.json';

export const MULTIPLIERS: {[key: number]: number} = {
    0: 16,
    1: 9,
    2: 2,
    3: 1.4,
    4: 1.4,
    5: 1.2,
    6: 1.1,
    7: 1,
    8: 0.5,
    9: 1,
    10: 1.1,
    11: 1.2,
    12: 1.4,
    13: 1.4,
    14: 2,
    15: 9,
    16: 16
};

export const outcomes: {[key: string]: number[]} = outcomesData;

export interface GameResult {
    /** Padded start X position to drop the ball from. */
    point: number;
    /** Multiplier returned by the API (the ball is guaranteed to land here). */
    multiplier: number;
}

// External Plinko API config.
const API_BASE = 'http://4.237.228.146:7575/api';
const USER_ID = 'GabyPlinkoMaster';
const API_HEADERS = {
    'accept': 'text/plain',
    'X-API-Key': '1234',
    'Content-Type': 'application/json',
};

const callPlay = () =>
    axios.post(`${API_BASE}/Plinko/play`, {
        userId: USER_ID,
        amount: 1,
        rows: 16,
        risk: 'Low',
        currency: 'USDT',
    }, { headers: API_HEADERS });

// The API requires an active provably-fair seed per user. A fresh user (or one
// whose seed was revealed/rotated) returns errorType "NoActiveSeed"; this
// creates the initial seed so play can proceed.
const createInitialSeed = () =>
    axios.post(`${API_BASE}/Seeds/CreateInitialGameSeed`, { userId: USER_ID }, { headers: API_HEADERS });

export const playGame = async (): Promise<GameResult> => {
    try {
        let response = await callPlay();

        // Self-heal: if there's no active seed, create one and retry once.
        if (!response.data?.success && response.data?.errorType === 'NoActiveSeed') {
            console.warn('No active seed for user — creating initial seed and retrying.');
            await createInitialSeed();
            response = await callPlay();
        }

        if (!response.data?.success || !response.data?.data) {
            throw new Error(response.data?.message || 'Play request was not successful.');
        }

        const { multiplier } = response.data.data;

        const matchingOutcomeIndices: number[] = [];
        for (const key in MULTIPLIERS) {
            if (MULTIPLIERS[key] === multiplier) {
                matchingOutcomeIndices.push(parseInt(key));
            }
        }

        if (matchingOutcomeIndices.length === 0) {
            console.error("Could not find matching outcome for multiplier:", multiplier);
            throw new Error("Could not find matching outcome for multiplier.");
        }

        const outcomeIndex = matchingOutcomeIndices[Math.floor(Math.random() * matchingOutcomeIndices.length)];

        const possibleOutcomes = outcomes[outcomeIndex.toString()];
        if (!possibleOutcomes || possibleOutcomes.length === 0) {
            console.error("No possible outcomes for multiplier:", multiplier);
            throw new Error("No possible outcomes for the determined multiplier.");
        }

        const startX = possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];

        return { point: startX, multiplier };

    } catch (error) {
        const details = axios.isAxiosError(error) ? (error.response?.data ?? error.message) : error;
        console.error("Error calling external API:", details);
        throw new Error("Failed to play game via external API.");
    }
};
