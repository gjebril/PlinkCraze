# CrazePOCGames

A collection of proof-of-concept casino games. The frontend is **React + TypeScript** (Vite),
with each game rendered by **Phaser 3**; the shared **Express** backend returns predetermined
("imitation") outcomes that each game animates deterministically.

**Games:** Plinko (complete) · Dice (Phaser slider ported from the reference — draggable target, win/loss gradient, animated result; sounds/exact art assets omitted).

## How a game works (Plinko)

The games are **outcome-driven**, not free-physics:

1. The frontend calls the external game API (via `playGame`) and receives a `multiplier`.
2. It looks up a **start X position** from `outcomes.json` that is known to land in the sink for
   that multiplier under the game's physics.
3. The Phaser scene drops a ball from that start position. The physics is **deterministic** —
   given the start X it always lands in the predetermined sink. The visible "physics" is a
   faithful replay of the server result, not a fair random drop.

> ⚠️ The ball physics in `games/plinko/game/physics.ts` and the board geometry in
> `objects.ts`/`constants.ts` are tuned to match `outcomes.json`. **Do not change the gravity,
> friction, peg layout, or sink layout** without regenerating `outcomes.json`, or balls will
> land in the wrong sinks.

## Project structure

```
CrazePOCGames/
├── frontend/                       # React + TypeScript + Vite + Phaser
│   └── src/
│       ├── App.tsx                 # Router over the games registry
│       ├── pages/Home.tsx          # Landing menu listing the games
│       ├── components/GameShell.tsx# "← Games" back-link wrapper for game routes
│       └── games/
│           ├── index.ts            # GAMES registry (add new games here)
│           ├── types.ts            # GameEntry interface
│           └── plinko/             # One self-contained game per folder
│               ├── index.ts            # Exports the `plinko` GameEntry
│               ├── PlinkoWrapper.tsx   # Integration layer (API/balance/auth seam)
│               ├── Plinko.tsx          # Orchestrator: bet state, history, wiring
│               ├── Simulation.tsx      # Dev tool: regenerate outcomes.json
│               ├── gameLogic.ts        # API client (playGame)
│               ├── outcomes.json       # Predetermined start positions per multiplier
│               ├── components/         # GameDisplay (React↔Phaser bridge), controls, history
│               ├── game/               # Phaser scene, physics, geometry, constants
│               ├── hooks/              # useBetting, useGameHistory
│               └── utils.ts            # Multiplier → color helpers
└── backend/                        # Express API (shared, run once — unchanged)
    └── src/
        ├── index.ts                # Server + outcome selection
        └── outcomes.ts             # Outcome data
```

### Adding a new game

1. Create `src/games/<game>/` with the same shape as `plinko/` (a router-agnostic
   integration `Component`, plus a `game/` Phaser module).
2. Export a `GameEntry` from its `index.ts` (`id`, `name`, `path`, `Component`, optional `Simulation`).
3. Add it to the `GAMES` array in `src/games/index.ts`. Routes and the menu update automatically.

### Architecture notes (for the games team)

- **Games are self-contained and router-agnostic.** A game folder knows nothing about routing or
  the other games; navigation lives in `App.tsx` / `pages/Home.tsx` / `GameShell`. This keeps each
  game portable (e.g. for dropping into the platform monorepo later).
- **Phaser behind a plain handle.** `createPlinkoGame(config)` returns
  `{ drop, setCallbacks, isReady, destroy }`. React never touches a raw Phaser object.
- **Wrapper vs. orchestrator split.** `PlinkoWrapper` is the seam for platform concerns
  (balance, auth, currency, bet validation) — currently it just forwards to `playGame`.
  `Plinko` owns gameplay state and knows nothing about how results are fetched.
- **`GameDisplay` is the bridge.** It creates/destroys the Phaser game in a div and forwards
  scene callbacks through refs so prop changes never re-initialise the game.
- This layout intentionally mirrors our Dice in-house game.

## Routes

- `/` — games menu
- `/plinko` — the Plinko game
- `/plinko/simulation` — Plinko dev/simulation tool
- `/dice` — the Dice game (drag the slider to set the target, then ROLL)

## Simulation tool

A built-in dev tool regenerates `outcomes.json` if the board geometry or physics ever change.
Open `http://localhost:5173/plinko/simulation` (or the "Simulation tool" link on the menu).
Click **Start** to rain random balls, let it collect samples, then **Export JSON** to download a
fresh, correctly-shaped outcome table (start positions grouped by sink index).

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

The game calls an external Plinko API (configured in `frontend/src/games/plinko/gameLogic.ts`):

- **Endpoint**: `POST http://4.237.228.146:7575/api/Plinko/play`
- **Headers**: `X-API-Key: 1234`, `Content-Type: application/json`
- **Config**: 16 rows, Low risk, USDT — multipliers range 0.5x → 16x

### Provably-fair seeds

The API requires an **active seed per user**. A fresh user (or one whose seed
was rotated/revealed) makes `/play` return `{ success: false, errorType: "NoActiveSeed" }`.
`gameLogic.ts` self-heals this: on `NoActiveSeed` it calls
`POST /api/Seeds/CreateInitialGameSeed` for the user and retries the play once.
The full API (Swagger at `/swagger`) also exposes `/api/Plinko/Verify` and the
`/api/Seeds/*` endpoints for seed management and provably-fair verification.

## License

ISC
