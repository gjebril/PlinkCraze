import { Link } from 'react-router-dom';
import { GAMES } from '../games';

/** Landing menu — premium game cards with preview art, accents, and hover. */
export default function Home() {
  return (
    <div className="min-h-screen bg-dark-blue px-6 py-16" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">Craze POC Games</h1>
          <p className="mt-2 text-sm text-light-gray/50">Proof-of-concept casino games</p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => {
            const Thumb = game.Thumbnail;
            const accent = game.accent ?? '#00e700';
            return (
              <div
                key={game.id}
                className="group overflow-hidden rounded-2xl bg-dark-blue-secondary shadow-lg ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-1 hover:ring-white/20"
              >
                <Link to={game.path} className="block">
                  <div
                    className="relative flex h-40 items-center justify-center"
                    style={{ background: `radial-gradient(130% 130% at 50% 0%, ${accent}26, transparent 70%)` }}
                  >
                    {Thumb && (
                      <div className="h-28 w-44 transition-transform duration-200 group-hover:scale-105">
                        <Thumb />
                      </div>
                    )}
                    {game.status === 'wip' && (
                      <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-light-gray/80">
                        WIP
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col gap-4 p-5">
                  <div>
                    <h2 className="text-lg font-bold text-white">{game.name}</h2>
                    {game.tagline && <p className="mt-1 text-xs text-light-gray/50">{game.tagline}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={game.path}
                      className="flex-1 rounded-lg py-2.5 text-center text-sm font-bold text-black transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accent }}
                    >
                      Play
                    </Link>
                    {game.Simulation && (
                      <Link
                        to={`${game.path}/simulation`}
                        className="rounded-lg border border-dark-gray px-3 py-2.5 text-xs font-medium text-light-gray/60 transition-colors hover:text-white"
                      >
                        Sim
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
