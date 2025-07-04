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
    point: number;
    multiplier: number;
    pattern: string[];
}

export const playGame = async (): Promise<GameResult> => {
    console.log("Starting game...");
    
    // Always use fallback for now since proxies are unreliable
    const fallbackMultipliers = [0.5, 1, 1.1, 1.2, 1.4, 2, 9, 16];
    const randomMultiplier = fallbackMultipliers[Math.floor(Math.random() * fallbackMultipliers.length)];
    
    let matchingIndices: number[] = [];
    for (const key in MULTIPLIERS) {
        if (MULTIPLIERS[key] === randomMultiplier) {
            matchingIndices.push(parseInt(key));
        }
    }
    
    const outcomeIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
    const possibleOutcomes = outcomes[outcomeIndex.toString()];
    
    if (possibleOutcomes && possibleOutcomes.length > 0) {
        const startX = possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
        const randomPattern = Array(16).fill(0).map(() => Math.random() > 0.5 ? 'R' : 'L');
        
        console.log("Generated game result:", { multiplier: randomMultiplier, startX });
        return {
            point: startX,
            multiplier: randomMultiplier,
            pattern: randomPattern
        };
    }
    
    throw new Error("Failed to generate game result.");
};