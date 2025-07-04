
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
    <div className="flex w-full h-screen bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-800 p-6 flex flex-col space-y-6">
        {/* Manual/Auto Toggle */}
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button className="flex-1 bg-gray-600 text-white py-2 rounded-md font-medium">
            Manual
          </button>
          <button className="flex-1 text-gray-400 py-2 rounded-md font-medium">
            Auto
          </button>
        </div>

        {/* Bet Amount */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-gray-300 font-medium">Bet Amount</label>
            <span className="text-gray-400 text-sm">0.00 NZD</span>
          </div>
          <div className="flex items-center bg-gray-700 rounded-lg p-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs font-bold">$</span>
            </div>
            <input 
              type="text" 
              value="0.00000000"
              className="flex-1 bg-transparent text-white outline-none"
              readOnly
            />
            <div className="flex space-x-2 ml-3">
              <button className="text-gray-400 hover:text-white">½</button>
              <button className="text-gray-400 hover:text-white">2x</button>
            </div>
          </div>
        </div>

        {/* Risk */}
        <div>
          <label className="text-gray-300 font-medium mb-3 block">Risk</label>
          <div className="flex space-x-2">
            <button className="flex-1 bg-gray-600 text-white py-2 rounded-md font-medium">
              Low
            </button>
            <button className="flex-1 text-gray-400 py-2 rounded-md font-medium hover:bg-gray-700">
              Medium
            </button>
            <button className="flex-1 text-gray-400 py-2 rounded-md font-medium hover:bg-gray-700">
              High
            </button>
          </div>
        </div>

        {/* Rows */}
        <div>
          <label className="text-gray-300 font-medium mb-3 block">Rows</label>
          <div className="text-white text-xl">16</div>
        </div>

        {/* Bet Button */}
        <button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          onClick={async () => {
            const response = await playGame();
            if (ballManager) {
              ballManager.addBall(response.point);
            }
          }}
        >
          Bet
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center relative bg-gray-900">
        <canvas 
          ref={canvasRef} 
          width="800" 
          height="800" 
          className="max-w-[600px] max-h-[600px] w-full h-full"
        />

        {/* Right Side Multipliers */}
        <div className="absolute top-6 right-6 flex flex-col space-y-2">
          {lastMultipliers.map((result, index) => (
            <div
              key={index}
              className="px-3 py-1 rounded-full text-sm font-bold min-w-[50px] text-center"
              style={{
                backgroundColor: '#f59e0b',
                opacity: (index + 1) / lastMultipliers.length,
                color: 'black'
              }}
            >
              {result.multiplier}x
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

