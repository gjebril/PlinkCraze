import { useCallback, useEffect, useRef, useState } from 'react';
import GameDisplay from './components/GameDisplay';
import { NUM_SINKS, WIDTH } from './game/constants';
import type { PlinkoGame } from './game/game';
import { pad } from './game/padding';

interface SimRow {
  startX: number;
  multiplier: number;
  bin: number;
}

const DROP_INTERVAL_MS = 250;

/**
 * Dev tool: continuously drops balls from random start positions and records
 * which sink each one lands in. Export produces an `outcomes.json`-shaped file
 * (start positions grouped by sink index) so the table can be regenerated if
 * the board geometry or physics ever change.
 */
export default function Simulation() {
  const gameRef = useRef<PlinkoGame | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [rows, setRows] = useState<SimRow[]>([]);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  const handleBallLanded = useCallback((bin: number, multiplier: number, startX: number) => {
    setRows((prev) => [...prev, { startX, multiplier, bin }]);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== null || !gameRef.current) return;
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      const startX = pad(WIDTH / 2 + 20 * (Math.random() - 0.5));
      gameRef.current?.drop(startX);
    }, DROP_INTERVAL_MS);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const download = useCallback(() => {
    const grouped: Record<string, number[]> = {};
    for (let i = 0; i < NUM_SINKS; i++) grouped[i.toString()] = [];
    rows.forEach((r) => grouped[r.bin.toString()]?.push(r.startX));

    const blob = new Blob([JSON.stringify(grouped, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outcomes-generated.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-blue">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-stretch justify-center gap-4 p-4 lg:flex-row">
        {/* Controls */}
        <div className="flex w-full flex-col gap-3 rounded-lg bg-dark-blue-secondary p-4 lg:w-1/3">
          <h2 className="text-lg font-bold text-white">Simulation</h2>
          <p className="text-xs text-light-gray/70">
            Drops random balls and records landing sinks. Export to regenerate the outcome table.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={running ? stop : start}
              disabled={!ready}
              className="flex-1 rounded-lg bg-highlight-green py-2 font-bold text-black hover:opacity-90 disabled:opacity-40"
            >
              {running ? 'Stop' : 'Start'}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={rows.length === 0}
              className="flex-1 rounded-lg bg-dark-gray py-2 font-bold text-white hover:opacity-90 disabled:opacity-40"
            >
              Export JSON
            </button>
          </div>

          <div className="text-sm text-light-gray">Samples collected: {rows.length}</div>

          <div className="h-80 overflow-auto rounded-md bg-dark-blue p-2 font-mono text-xs text-light-gray/80">
            {rows
              .slice(-200)
              .reverse()
              .map((r, i) => (
                <div key={i}>
                  bin {r.bin} · {r.multiplier}x · startX {Math.round(r.startX)}
                </div>
              ))}
          </div>
        </div>

        {/* Board */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative aspect-square w-full max-w-[800px]">
            <GameDisplay gameRef={gameRef} onGameReady={() => setReady(true)} onBallLanded={handleBallLanded} />
          </div>
        </div>
      </div>
    </div>
  );
}
