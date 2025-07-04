
import { useEffect, useRef, useState } from "react";
import { BallManager } from "../game/classes/BallManager";
import axios from "axios";
import { Button } from "../components/ui";
import { baseURL } from "../utils";

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
        (index, startX, multiplier, color) => {
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
    <div className="flex  items-center justify-center w-full">
      <div className="flex flex-col lg:flex-row items-center justify-center bg-dark-blue-secondary p-4 rounded-lg">
        <div className="w-full lg:w-1/4 bg-dark-blue p-4 rounded-lg flex items-center justify-center">
          <Button
            className="w-full bg-highlight-green text-black font-bold py-4 rounded-lg"
            onClick={async () => {
              const response = await axios.post(`${baseURL}/game`, {
                data: 1,
              });
              if (ballManager) {
                ballManager.addBall(response.data.point);
              }
            }}
          >
            BET
          </Button>
        </div>
        <div className="w-full lg:w-3/4 flex items-center justify-center relative">
          <canvas ref={canvasRef} width="800" height="800" className="w-full h-full max-w-[800px] max-h-[800px]"></canvas>
          <div className="absolute top-0 right-0 flex flex-col space-y-1 p-2">
            {lastMultipliers.map((result, index) => (
              <div
                key={index}
                className="px-2 py-1 rounded text-sm font-bold"
                style={{
                  backgroundColor: result.color,
                  opacity: (index + 1) / lastMultipliers.length, // Fading effect
                  color: result.multiplier === 16 ? 'white' : 'black',
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

