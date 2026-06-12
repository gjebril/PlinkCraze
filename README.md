# PlinkCraze

A web-based Plinko game. The frontend is built with **React + TypeScript** and renders the
board with **Phaser 3**; the **Express** backend returns predetermined ("imitation") outcomes
that the board then animates deterministically.

## How the game works

PlinkCraze is **outcome-driven**, not free-physics:

1. The frontend calls the external Plinko API (via `playGame`) and receives a `multiplier`.
2. It looks up a **start X position** from `outcomes.json` that is known to land in the sink for
   that multiplier under the game's physics.
3. The Phaser scene drops a ball from that start position. The physics is **deterministic** —
   given the start X it always lands in the predetermined sink. The visible "physics" is a
   faithful replay of the server result, not a fair random drop.

> ⚠️ The ball physics in `frontend/src/game/plinko/game/physics.ts` and the board geometry in
> `objects.ts`/`constants.ts` are tuned to match `outcomes.json`. **Do not change the gravity,
> friction, peg layout, or sink layout** without regenerating `outcomes.json`, or balls will
> land in the wrong sinks.

## Project structure

```
PlinkCraze/
├── frontend/                     # React + TypeScript + Vite + Phaser
│   └── src/
│       ├── App.tsx               # Renders <PlinkoWrapper/>
│       └── game/
│           ├── gameLogic.ts      # Backend/imitation API client (playGame)
│           ├── outcomes.json     # Predetermined start positions per multiplier
│           └── plinko/           # The game feature (mirrors our Dice game's layout)
│               ├── index.ts            # Barrel exports
│               ├── PlinkoWrapper.tsx   # Integration layer (API/balance/auth seam)
│               ├── Plinko.tsx          # Orchestrator: bet state, history, wiring
│               ├── Simulation.tsx      # Dev tool: regenerate outcomes.json
│               ├── components/
│               │   ├── GameDisplay.tsx        # React ↔ Phaser bridge
│               │   ├── GameBottomControls.tsx # BET button + amount
│               │   └── HistoryDisplay.tsx     # Recent multipliers
│               ├── game/
│               │   ├── game.ts        # PlinkoScene (Phaser) + createPlinkoGame() handle
│               │   ├── physics.ts     # Headless ball physics
│               │   ├── objects.ts     # Peg/sink geometry
│               │   ├── constants.ts   # Dimensions, physics, colors, multipliers
│               │   └── padding.ts     # Fixed-point helpers
│               ├── hooks/
│               │   ├── useBetting.ts      # Bet → API → drop
│               │   ├── useGameHistory.ts  # Rolling multiplier history
│               │   └── types.ts
│               └── utils.ts            # Multiplier → color gradient
└── backend/                      # Express API (unchanged)
    └── src/
        ├── index.ts              # Server + outcome selection
        └── outcomes.ts           # Outcome data
```

### Architecture notes (for the games team)

- **Phaser behind a plain handle.** `createPlinkoGame(config, viewMode)` returns
  `{ drop, setCallbacks, setMuted, isReady, destroy }`. React never touches a raw Phaser object.
- **Wrapper vs. orchestrator split.** `PlinkoWrapper` is the seam for platform concerns
  (balance, auth, currency, bet validation) — currently it just forwards to `playGame`.
  `Plinko` owns gameplay state and knows nothing about how results are fetched.
- **`GameDisplay` is the bridge.** It creates/destroys the Phaser game in a div and forwards
  scene callbacks through refs so prop changes never re-initialise the game.
- This layout intentionally mirrors our Dice in-house game so it can later be ported into the
  platform monorepo with minimal reshaping.

## Simulation tool

A built-in dev tool regenerates `outcomes.json` if the board geometry or physics
ever change. Open the app and click **"Simulation ↗"** (bottom-left), or go to
`http://localhost:5173/#simulation`. Click **Start** to rain random balls, let it
collect samples, then **Export JSON** to download a fresh, correctly-shaped
outcome table (start positions grouped by sink index).

## Technology stack

- **Frontend**: React 18, TypeScript, Vite, Phaser 3, Tailwind CSS, Axios
- **Backend**: Express, TypeScript, CORS, Axios

## Getting started

Install dependencies:

```bash
cd frontend && npm install
cd ../backend && npm install
```

Run the frontend (dev):

```bash
cd frontend && npm run dev      # http://localhost:5173
```

Run the backend:

```bash
cd backend && npm run build && npm start   # http://localhost:3000
```

Production build:

```bash
cd frontend && npm run build    # outputs to frontend/dist
```

## API integration

The game calls an external Plinko API (configured in `frontend/src/game/gameLogic.ts`):

- **Endpoint**: `POST http://4.237.228.146:7575/api/Plinko/play`
- **Headers**: `X-API-Key: 1234`, `Content-Type: application/json`
- **Config**: 16 rows, Low risk, USDT — multipliers range 0.5x → 16x

## License

ISC
