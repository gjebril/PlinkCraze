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
    try {
        // Use different API URL based on environment
        const apiUrl = window.location.protocol === 'https:' 
            ? 'https://cors-anywhere.herokuapp.com/http://4.237.228.146:7575/api/Plinko/play'
            : 'http://4.237.228.146:7575/api/Plinko/play';
            
        const externalApiResponse = await axios.post(apiUrl, {
            userId: "GabyPlinkoMaster",
            amount: 1,
            rows: 16,
            risk: "Low",
            currency: "USDT"
        }, {
            headers: {
                'accept': 'text/plain',
                'X-API-Key': '1234',
                'Content-Type': 'application/json'
            }
        });

        const { multiplier, plinkoResult } = externalApiResponse.data.data;
        console.log("External API plinkoResult:", plinkoResult);
        console.log("External API multiplier:", multiplier);

        let matchingOutcomeIndices: number[] = [];
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
        console.log("Raw possible outcomes for multiplier", multiplier, "(outcomeIndex", outcomeIndex, "):", possibleOutcomes);

        if (!possibleOutcomes || possibleOutcomes.length === 0) {
            console.error("No possible outcomes for multiplier:", multiplier);
            throw new Error("No possible outcomes for the determined multiplier.");
        }

        const transformedPattern = plinkoResult.map((val: number) => val === 0 ? 'L' : 'R');
        console.log("Transformed Plinko Pattern:", transformedPattern);

        const startX = possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
        console.log("Chosen startX:", startX);

        return {
            point: startX,
            multiplier,
            pattern: transformedPattern
        };

    } catch (error: any) {
        console.error("Error calling external API:", error.response?.data || error.message);
        
        // Fallback: generate random game result
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
            
            console.log("Using fallback game result");
            return {
                point: startX,
                multiplier: randomMultiplier,
                pattern: randomPattern
            };
        }
        
        throw new Error("Failed to play game via external API.");
    }
};