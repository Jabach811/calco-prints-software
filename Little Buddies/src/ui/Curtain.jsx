import React from 'react';
import { useGame } from '../state/store.js';

export function Curtain() {
  const curtain = useGame((s) => s.curtain);
  if (!curtain) return null;
  return (
    <div className={`gc-curtain ${curtain}`}>
      <div className="gc-curtain-half gc-curtain-l" />
      <div className="gc-curtain-half gc-curtain-r" />
    </div>
  );
}
