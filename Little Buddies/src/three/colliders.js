// Coarse circle colliders — generous, kid-friendly. [x, z, radius]
import { STREAM_PATH } from './Nature.jsx';

export const COLLIDERS = [
  // hotel body (row of circles across its footprint) — lobby pocket left open at front
  [-26, -60, 8], [-16, -62, 8], [-5, -64, 9], [6, -62, 8], [16, -60, 8],
  [-19, -55, 4.5], [11, -55, 4.5],
  // lobby interior back wall + desk
  [-3.5, -62, 4], [-3.5, -62.5, 4],
  // waterfall cliffs
  [-68, -62, 7], [-70, -52, 6], [-71, -43, 5],
  // hotel hill sides
  [-40, -70, 10], [30, -70, 10],
  // snack stand
  [44.5, 26, 3.2],
  // heart arch posts (walk through the middle)
  [32.5, 42.5, 0.9], [35.5, 42.5, 0.9],
  // ponds
  [26, 58, 3.8], [44, 56, 2.8],
  // playground
  [-52, 38, 2.2], [-42, 48, 2.6],
  // plaza center bed
  [0, 4, 4.8],
  // rose bed + plot
  [27, 47, 3.4], [23, 40, 2.4],
  // palms
  [66, -12, 1], [40, -30, 1], [64, -30, 1],
  // lamp/mailbox/mushroom/signs
  [8, 26, 0.8], [-4, 52, 0.7], [-8.5, -8, 0.5], [4, 18, 0.5], [38, -6, 0.5],
  // benches
  [41, 59.6, 1.2], [35, 6.6, 1.2],
  // desk approach limit
  [1.5, -52.5, 2.6],
];

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
