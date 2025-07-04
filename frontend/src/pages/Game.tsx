
import { useEffect, useRef, useState } from "react";
import { BallManager } from "../game/classes/BallManager";
import { playGame } from "../game/gameLogic";

export function Game() {
  const [ballManager, setBallManager] = useState<BallManager>();
  const canvasRef = useRef<any>();

  useEffect(() => {
    if (canvasRef.current) {
      const ballManager = new BallManager(
        canvasRef.current as unknown as HTMLCanvasElement,
        (_index, _startX, _multiplier, _color) => {
          // Minimal UI - no multiplier display needed
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
        <canvas 
          ref={canvasRef} 
          width="800" 
          height="800" 
          className="w-full h-full max-w-[90vmin] max-h-[90vmin] rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}

