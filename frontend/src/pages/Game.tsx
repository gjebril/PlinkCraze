
import { useEffect, useRef, useState } from "react";
import { BallManager } from "../game/classes/BallManager";
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
    <div className="flex w-full h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Minimal Left Panel - Only Bet Button */}
      <div className="flex items-center justify-center p-6">
        <button
          className="
            bg-gradient-to-r from-orange-500 to-orange-600 
            hover:from-orange-600 hover:to-orange-700 
            active:scale-95
            text-white font-bold text-xl
            px-8 py-4 rounded-2xl
            shadow-lg hover:shadow-xl
            transition-all duration-200
            animate-pulse hover:animate-none
            border-2 border-orange-400
          "
          style={{ fontFamily: 'Inter, sans-serif' }}
          onClick={async () => {
            const response = await playGame();
            if (ballManager) {
              ballManager.addBall(response.point);
            }
          }}
        >
          BET
        </button>
      </div>

      {/* Full Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-[90vmin] max-h-[90vmin]">
          <canvas 
            ref={canvasRef} 
            width="800" 
            height="800" 
            className="w-full h-full rounded-lg shadow-2xl"
          />
          
          {/* Rolling Multiplier Display - Inside Game Frame */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
            {lastMultipliers.map((result, index) => (
              <div
                key={index}
                className="px-3 py-1 rounded-full text-sm font-bold min-w-[50px] text-center shadow-lg"
                style={{
                  backgroundColor: result.color,
                  opacity: (index + 1) / lastMultipliers.length,
                  color: result.multiplier === 16 ? 'white' : 'black',
                  fontFamily: 'Inter, sans-serif'
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

