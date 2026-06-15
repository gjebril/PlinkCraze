import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import SessionStats from './SessionStats';

/** Wraps a game route with a "back to games" link and the session HUD. */
export default function GameShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Link
        to="/"
        className="fixed left-3 top-3 z-50 rounded bg-dark-blue-secondary px-3 py-1 text-xs text-light-gray/70 transition-colors hover:text-white"
      >
        ← Games
      </Link>
      <SessionStats />
    </>
  );
}
