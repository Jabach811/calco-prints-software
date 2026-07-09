// Coarse circle colliders — generous, kid-friendly. [x, z, radius]
import { STREAM_PATH, PINE_SPOTS, LOLLIPOP_SPOTS, BOULDER_SPOTS } from './Nature.jsx';

export const LAMP_SPOTS = [[10, 8], [14, 22], [-22, 20], [4, 40], [24, -26], [-14, -34], [36, 20], [-2, 64]];

export const COLLIDERS = [
  // hotel wings — the lobby doorway between them (x -13..3 at z -52) stays open
  [-19.5, -56, 6.8], [-19.5, -63.5, 6.8],
  [9.5, -56, 6.8], [9.5, -63.5, 6.8],
  // lobby back wall
  [-12, -67, 2], [-8.5, -67, 2], [-5, -67, 2], [-1.5, -67, 2], [2, -67, 2],
  // reception desk
  [-5.6, -62.6, 1.5], [-3.5, -62.3, 1.5], [-1.4, -62.6, 1.5],
  // grand staircase up the left hillside
  [-26.5, -52.5, 1.8], [-29, -55, 1.8], [-31.5, -57.5, 1.8],
  [-33.6, -60.4, 2.4], [-33.6, -64, 1.9], [-33.6, -67.5, 1.9],
  // waterfall cliffs
  [-68, -62, 7], [-70, -52, 6], [-71, -43, 5],
  // hotel hill sides
  [-40, -70, 10], [30, -70, 10],
  // forest hills at the world edge
  [-40, -85, 18], [20, -92, 22], [-80, -55, 15], [70, -75, 16], [-95, -10, 12],
  // snack stand + menu board + umbrella table
  [44.5, 26, 3.2], [43.4, 29.4, 0.9], [41, 24.5, 1.1],
  // gaming corner arcade
  [60, 10, 4.8],
  // heart arch posts (walk through the middle)
  [32.5, 42.5, 0.9], [35.5, 42.5, 0.9],
  // ponds
  [26, 58, 3.8], [44, 56, 2.8],
  // garden log stools
  [36, 62, 0.65], [22, 52, 0.65], [46, 48, 0.65],
  // playground: kiddie slide, swing set, beach ball
  [-52, 38, 2.2], [-42, 48, 2.6], [-48, 32, 0.7],
  // plaza center bed
  [0, 4, 4.8],
  // rose bed + plot
  [27, 47, 3.4], [23, 40, 2.4],
  // palms
  [66, -12, 1], [40, -30, 1], [64, -30, 1],
  // pool: loungers, life-ring post, rock falls
  [44, -2, 1.1], [49, 0, 1.1], [38, -8, 0.45], [60.5, -26, 1.7], [63.5, -26, 1.7],
  // mailbox/mushroom/signs
  [8, 26, 0.8], [-4, 52, 0.7], [4, 18, 0.5], [38, -6, 0.5], [5.5, -51, 0.5],
  // benches
  [41, 59.6, 1.2], [35, 6.6, 1.2],
];

// lamp posts
LAMP_SPOTS.forEach(([x, z]) => COLLIDERS.push([x, z, 0.5]));
COLLIDERS.push([-8.5, -8, 0.5]); // plaza lamp

// garden picket fence arc
for (let i = 0; i < 14; i++) {
  const a = -0.6 + (i / 14) * 2.4;
  COLLIDERS.push([35 + Math.cos(a) * 17, 52 + Math.sin(a) * 14, 1.1]);
}

// trees + boulders
PINE_SPOTS.forEach((p) => COLLIDERS.push([p.x, p.z, 0.7 * p.s]));
LOLLIPOP_SPOTS.forEach((p) => COLLIDERS.push([p.x, p.z, 0.55 * p.s]));
BOULDER_SPOTS.forEach((p) => COLLIDERS.push([p.x, p.z, 0.9 * p.s]));

// stream: line of colliders along the path
STREAM_PATH.forEach(([x, z]) => {
  COLLIDERS.push([x, z, 3.4]);
});

export const WORLD_RADIUS = 100;

export function resolveCollisions(x, z, r = 0.55) {
  for (const [cx, cz, cr] of COLLIDERS) {
    const dx = x - cx, dz = z - cz;
    const d = Math.hypot(dx, dz);
    const min = cr + r;
    if (d < min && d > 0.0001) {
      x = cx + (dx / d) * min;
      z = cz + (dz / d) * min;
    }
  }
  const d0 = Math.hypot(x, z);
  if (d0 > WORLD_RADIUS) {
    x = (x / d0) * WORLD_RADIUS;
    z = (z / d0) * WORLD_RADIUS;
  }
  return [x, z];
}
