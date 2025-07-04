
import { useEffect, useRef, useState } from "react";
import { BallManager } from "../game/classes/BallManager";
import { Button } from "../components/ui";
import { playGame } from "../game/gameLogic";

interface MultiplierResult {
  multiplier: number;
  color: string;
}

export function Game() {
  const [ballManager, setBallManager] = useState<BallManager>();
  const canvasRef = useRef<any>();
  const [lastMultipliers, setLastMultipliers] = useState<MultiplierResult[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      const ballManager = new BallManager(
        canvasRef.current as unknown as HTMLCanvasElement,
        (_index, _startX, multiplier, color) => {
          if (multiplier !== undefined && color !== undefined) {
            setLastMultipliers((prevMultipliers) => {
              const newMultipliers = [...prevMultipliers, { multiplier, color }];
              if (newMultipliers.length > 8) {
                return newMultipliers.slice(newMultipliers.length - 8);
              }
              return newMultipliers;
            });
          }
        }
      );
      setBallManager(ballManager);
    }
  }, [canvasRef]);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-dark-blue">
      <div className="flex flex-col lg:flex-row items-center justify-center w-full h-full max-w-7xl mx-auto p-4">
        <div className="w-full lg:w-1/4 bg-dark-blue-secondary p-6 rounded-lg flex items-center justify-center mb-4 lg:mb-0 lg:mr-6">
          <Button
            className="w-full bg-highlight-green text-black font-bold py-6 rounded-lg text-lg"
            onClick={async () => {
              const response = await playGame();
              if (ballManager) {
                ballManager.addBall(response.point);
              }
            }}
          >
            BET
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center relative">
          <canvas ref={canvasRef} width="800" height="800" className="w-full h-full max-w-[800px] max-h-[800px] rounded-lg"></canvas>
          <div className="absolute top-4 right-4 flex flex-col space-y-2 p-3">
            {lastMultipliers.map((result, index) => (
              <div
                key={index}
                className="px-4 py-2 rounded text-sm font-bold min-w-[60px] text-center shadow-lg border border-black border-opacity-20"
                style={{
                  backgroundColor: result.color,
                  opacity: (index + 1) / lastMultipliers.length, // Fading effect
                  color: result.multiplier === 16 ? 'white' : 'black',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {result.multiplier}x
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

