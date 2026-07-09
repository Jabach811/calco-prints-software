// Every game registers here. Adding a game later = one entry + its folder.
// UI mounts as a full-screen DOM layer; Stage (optional) mounts inside the
// app's single <Canvas> while the game is active.
import { DanceUI } from './dance/DanceGame.jsx';
import { DanceStage } from './dance/DanceStage.jsx';

export const GAMES = [
  { id: 'dance', name: 'Dance Studio', icon: '🕺', status: 'open', tagline: 'Blobs drop beats. You drop moves.', UI: DanceUI, Stage: DanceStage },
  { id: 'invaders', name: 'Blob Invaders', icon: '👾', status: 'coming_soon', tagline: 'Pew pew. Eventually.' },
  { id: 'platformer', name: 'Blobby Jump', icon: '🍄', status: 'coming_soon', tagline: 'Still learning to jump.' },
];

export const gameById = Object.fromEntries(GAMES.map((g) => [g.id, g]));
