import { useEffect, useRef, useState } from "react";
import { BallManager } from "../game/classes/BallManager";
import { WIDTH } from "../game/constants";
import { pad } from "../game/padding";
import { MULTIPLIERS } from "../game/gameLogic";

export function Simulation() {
  const canvasRef = useRef<any>();
  const [outputs, setOutputs] = useState<{ startX: number; multiplier: number; bin: number }[]>([]);

  const saveSimulationData = async () => {
    try {
      // Group startX values by bin (outcome index)
      const outcomesByBin: {[key: string]: number[]} = {};
      
      // Initialize empty arrays for all bins
      for (let i = 0; i <= 16; i++) {
        outcomesByBin[i.toString()] = [];
      }
      
      // Group the startX values by bin
      outputs.forEach(output => {
        outcomesByBin[output.bin.toString()].push(output.startX);
      });
      
      const blob = new Blob([JSON.stringify(outcomesByBin, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `new-outcomes-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert("Outcomes data saved successfully!");
    } catch (error) {
      console.error("Error saving simulation data:", error);
      alert("Failed to save simulation data.");
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ballManager = new BallManager(
        canvasRef.current as unknown as HTMLCanvasElement,
        (index: number, startX?: number) => {
          // This is where we get the final sink index and the startX
          // We need to map the index to a multiplier
          const multiplier = MULTIPLIERS[index];
          if (startX !== undefined && multiplier !== undefined) {
            setOutputs((prevOutputs) => [
              ...prevOutputs,
              { startX: startX, multiplier, bin: index },
            ]);
          }
        }
      );

      const simulate = async () => {
        let i = 0;
        while (true) {
          i++;
          // Randomly pick a starting X within a reasonable range
          const randomStartX = pad(WIDTH / 2 + 20 * (Math.random() - 0.5));
          ballManager.addBall(randomStartX);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Drop a ball every second
        }
      };

      simulate();

      return () => {
        ballManager.stop();
      };
    }
  }, [canvasRef]);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between h-screen">
      <div className="flex mx-16 flex-col justify-center pt-10">
        <h2 className="text-xl font-bold mb-4">Simulation Data</h2>
        <button
          onClick={saveSimulationData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Save Data
        </button>
        <div className="bg-dark-blue-secondary p-4 rounded-lg overflow-auto h-96">
          {outputs.map((output, index) => (
            <p key={index} className="text-sm">
              StartX: {output.startX}, Multiplier: {output.multiplier}, Bin: {output.bin}
            </p>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <canvas ref={canvasRef} width="800" height="800"></canvas>
      </div>
    </div>
  );
}

