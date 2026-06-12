import { useSyncExternalStore } from 'react';
import { PlinkoWrapper } from './game/plinko';
import Simulation from './game/plinko/Simulation';

/** Tiny hash-based view switch — avoids pulling in a router for two screens. */
function useHash(): string {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('hashchange', onChange);
      return () => window.removeEventListener('hashchange', onChange);
    },
    () => window.location.hash,
  );
}

function App() {
  const isSimulation = useHash() === '#simulation';

  return (
    <>
      {isSimulation ? <Simulation /> : <PlinkoWrapper />}
      <a
        href={isSimulation ? '#' : '#simulation'}
        className="fixed bottom-3 left-3 z-50 rounded bg-dark-blue-secondary px-3 py-1 text-xs text-light-gray/70 transition-colors hover:text-white"
      >
        {isSimulation ? '← Game' : 'Simulation ↗'}
      </a>
    </>
  );
}

export default App;
