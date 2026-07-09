import React from 'react';
import { useGame } from '../state/store.js';

export function Curtain() {
  const curtain = useGame((s) => s.curtain);
  if (!curtain) return null;
  return (
    <div className={`curtain ${curtain}`}>
      <div className="curtain-half curtain-l" />
      <div className="curtain-half curtain-r" />
    </div>
  );
}
