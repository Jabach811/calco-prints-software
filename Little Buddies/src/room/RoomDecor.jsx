import { RoundedBox } from '@react-three/drei';
import { mat } from '../three/materials.js';

function BedDecor({ color, accent }) {
  return (
    <group>
      <RoundedBox args={[2.25, 0.42, 1.55]} radius={0.14} position={[0, 0.34, 0]} material={mat(color, 'wood')} />
      <RoundedBox args={[2.05, 0.28, 1.38]} radius={0.12} position={[0, 0.66, 0.04]} material={mat(accent, 'plastic')} />
      <RoundedBox args={[0.82, 0.2, 0.58]} radius={0.12} position={[-0.5, 0.86, -0.28]} material={mat('#FFFFFF', 'plastic')} />
      <RoundedBox args={[2.28, 1.25, 0.2]} radius={0.1} position={[0, 0.83, 0.67]} material={mat(color, 'wood')} />
    </group>
  );
}

function RugDecor({ color, accent }) {
  return (
    <group>
      <mesh material={mat(color, 'plastic')} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.35, 1.35, 0.08, 24]} />
      </mesh>
      <mesh material={mat(accent, 'plastic')} position={[0, 0.045, 0]}>
        <torusGeometry args={[0.87, 0.12, 6, 24]} />
      </mesh>
    </group>
  );
}

function WallDecor({ color, accent }) {
  return (
    <group>
      <RoundedBox args={[2.1, 1.15, 0.12]} radius={0.06} material={mat(color, 'wood')} />
      <RoundedBox args={[1.75, 0.82, 0.08]} radius={0.04} position={[0, 0, -0.08]} material={mat(accent, 'plastic')} />
      <mesh material={mat(color, 'plastic')} position={[0, -0.72, 0]}>
        <coneGeometry args={[0.18, 0.35, 5]} />
      </mesh>
    </group>
  );
}

function ShelfDecor({ color, accent }) {
  return (
    <group>
      <RoundedBox args={[1.65, 0.16, 0.55]} radius={0.04} material={mat('#9A6A38', 'wood')} />
      <mesh material={mat(color, 'plastic')} position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.3, 0.24, 0.5, 12]} />
      </mesh>
      <mesh material={mat(accent, 'leaf')} position={[0, 0.78, 0]} scale={[1, 1.25, 0.55]}>
        <sphereGeometry args={[0.34, 10, 8]} />
      </mesh>
    </group>
  );
}

function TrophyDecor({ color, accent }) {
  return (
    <group>
      <mesh material={mat('#6B4423', 'wood')} position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.43, 0.5, 0.18, 12]} />
      </mesh>
      <mesh material={mat(color, 'gloss')} position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.26, 0.16, 0.9, 12]} />
      </mesh>
      <mesh material={mat(accent, 'gloss')} position={[0, 1.18, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.48, 0.55, 5]} />
      </mesh>
    </group>
  );
}

const DECOR_BY_KIND = Object.freeze({
  bed: BedDecor,
  rug: RugDecor,
  wall: WallDecor,
  shelf: ShelfDecor,
  trophy: TrophyDecor,
});

export function RoomDecor({ item, position, rotation, scale = 1 }) {
  if (!item) return null;
  const Decor = DECOR_BY_KIND[item.render?.kind];
  if (!Decor) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Decor color={item.render.color} accent={item.render.accent} />
    </group>
  );
}
