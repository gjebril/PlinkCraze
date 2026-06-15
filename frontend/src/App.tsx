import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GameShell from './components/GameShell';
import { GAMES } from './games';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {GAMES.map((game) => {
          const Game = game.Component;
          return <Route key={game.id} path={game.path} element={<GameShell><Game /></GameShell>} />;
        })}

        {GAMES.filter((game) => game.Simulation).map((game) => {
          const Sim = game.Simulation!;
          return (
            <Route key={`${game.id}-sim`} path={`${game.path}/simulation`} element={<GameShell><Sim /></GameShell>} />
          );
        })}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
