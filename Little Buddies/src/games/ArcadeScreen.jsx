// The Gaming Corner hub menu. Renders the registry; mounts the active game's UI.
import React from 'react';
import { useGame } from '../state/store.js';
import { GAMES, gameById } from './registry.js';

export function ArcadeScreen() {
  const arcade = useGame((s) => s.arcade);
  const g = arcade.game ? gameById[arcade.game] : null;
  if (g) return <g.UI />;
  return (
    <div className="arcade-screen">
      <div className="arcade-title">🕹️ GAMING CORNER</div>
      <div className="arcade-sub">Pick a game!</div>
      <div className="arcade-tiles">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className={'arcade-tile' + (game.status === 'open' ? '' : ' locked')}
            disabled={game.status !== 'open'}
            onClick={() => useGame.getState().launchGame(game.id)}
          >
            <span className="tile-icon">{game.status === 'open' ? game.icon : '🔒'}</span>
            <span className="tile-name">{game.name}</span>
            <span className="tile-tag">{game.status === 'open' ? game.tagline : 'Coming soon'}</span>
          </button>
        ))}
      </div>
      <button className="arcade-back" onClick={() => useGame.getState().exitArcade()}>← Back outside</button>
    </div>
  );
}
