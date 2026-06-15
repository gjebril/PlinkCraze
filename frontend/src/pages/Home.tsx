import { Link } from 'react-router-dom';
import { GAMES } from '../games';

/** Landing menu listing every game in the collection. */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-dark-blue p-8">
      <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Craze POC Games
      </h1>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {GAMES.map((game) => (
          <div key={game.id} className="flex flex-col gap-2 rounded-lg bg-dark-blue-secondary p-6">
            <Link
              to={game.path}
              className="rounded-md bg-highlight-green px-4 py-3 text-center text-lg font-bold text-black transition-opacity hover:opacity-90"
            >
              {game.name}
            </Link>
            {game.Simulation && (
              <Link
                to={`${game.path}/simulation`}
                className="text-center text-xs text-light-gray/60 transition-colors hover:text-white"
              >
                Simulation tool
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
