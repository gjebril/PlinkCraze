# PlinkCraze

A web-based Plinko game simulation built with React and TypeScript. The game features a realistic ball physics simulation and integrates with an external Plinko API for authentic gameplay mechanics.

## Features

- **Interactive Plinko Game**: Visual ball drop simulation with physics-based movement
- **Real-time Multipliers**: Dynamic payout calculations based on ball landing positions
- **External API Integration**: Connects to external Plinko service for game results
- **Responsive Design**: Built with React and Tailwind CSS for modern UI
- **Game Simulation**: Separate simulation mode for testing game mechanics

## Project Structure

```
PlinkCraze/
├── frontend/           # React TypeScript frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application pages
│   │   ├── game/       # Game logic and physics
│   │   └── utils/      # Helper functions
│   └── dist/          # Production build
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── index.ts   # Main server file
│   │   └── outcomes.ts # Game outcome configurations
│   └── dist-exec/     # Compiled executable
└── version-1/         # Legacy version
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing
- **Axios** - External API calls

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PlinkCraze
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Backend Development
```bash
cd backend
npm run build
npm start
```
The backend API will be available at `http://localhost:3000`

## Production Build

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend
npm run build
npm run package  # Creates executable in dist-exec/
```

## API Integration

The game integrates with an external Plinko API:
- **Endpoint**: `http://4.237.228.146:7575/api/Plinko/play`
- **Method**: POST
- **Headers**: 
  - `X-API-Key: 1234`
  - `Content-Type: application/json`

### Game Configuration
- **Rows**: 16
- **Risk Level**: Low
- **Currency**: USDT
- **Multipliers**: Range from 0.5x to 16x based on landing position

## Game Mechanics

1. **Ball Physics**: Realistic ball movement simulation using custom physics engine
2. **Outcome Calculation**: External API determines multiplier and path
3. **Visual Feedback**: Animated ball drop with real-time position updates
4. **Payout System**: Multipliers range from 0.5x to 16x based on final position

## Routes

- `/` - Home page (redirects to game)
- `/game` - Main Plinko game interface
- `/simulation` - Game simulation and testing mode

## License

ISC# PlinkCraze
