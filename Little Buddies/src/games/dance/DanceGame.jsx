import React from 'react';
import { useGame } from '../../state/store.js';

export function DanceUI() {
  return (
    <div className="arcade-screen">
      <div className="arcade-title">Dance Studio</div>
      <button className="arcade-back" onClick={() => useGame.getState().quitToArcade()}>← Arcade</button>
    </div>
  );
}
