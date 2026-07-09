// "Player joins the world" — 10s camera choreography per the shot list.
import * as THREE from 'three';
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { playerRt, camRt } from '../state/rt.js';
import { introElapsed, introClock } from '../state/introClock.js';
import { useGame } from '../state/store.js';
import { CATCHPHRASES } from '../data/dialogue.js';

const PAD = { x: 0, z: -34 };
const lerp = THREE.MathUtils.lerp;
const smooth = (t) => t * t * (3 - 2 * t);

export function CinematicDriver() {
  const { camera } = useThree();
  const waved = useRef(false);
  const hopped = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    playerRt.x = 0; playerRt.z = -21; playerRt.ry = Math.PI; // facing the hotel (north)
    playerRt.anim = 'idle'; playerRt.animT = 0;
  }, []);

  useFrame(() => {
    if (done.current) return;
    if (!introClock.t0) return; // clock not armed yet (first frames race the mount effect)
    const t = introClock.skipped ? 99 : introElapsed();

    if (t >= 9.6) {
      // hand off to gameplay camera
      done.current = true;
      playerRt.x = PAD.x; playerRt.z = PAD.z; playerRt.ry = Math.PI;
      camRt.yaw = 0; camRt.pitch = 0.42; camRt.dist = 11;
      useGame.getState().finishIntro();
      return;
    }

    // Buddy: walks in from behind camera onto the spawn pad (4-5s)
    if (t < 4) {
      playerRt.x = 0; playerRt.z = -21;
      if (playerRt.anim !== 'idle') { playerRt.anim = 'idle'; playerRt.animT = 0; }
    } else if (t < 5.4) {
      const k = smooth(Math.min((t - 4) / 1.4, 1));
      playerRt.x = 0;
      playerRt.z = lerp(-21, PAD.z, k);
      playerRt.ry = Math.PI;
      if (playerRt.anim !== 'walk') { playerRt.anim = 'walk'; playerRt.animT = 0; }
    } else {
      playerRt.x = PAD.x; playerRt.z = PAD.z;
      playerRt.ry = t < 8.4 ? 0 : Math.PI; // face camera for the close-up, then face the hotel
      if (t >= 5.8 && !waved.current) {
        waved.current = true;
        playerRt.anim = 'wave'; playerRt.animT = 0;
        const temperament = useGame.getState().profile?.temperament;
        useGame.getState().showBubble('me', CATCHPHRASES[temperament] || 'Wow! ⭐', 3.4);
      }
      if (t >= 7.4 && !hopped.current) {
        hopped.current = true;
        playerRt.anim = 'hop'; playerRt.animT = 0;
      }
    }

    // Camera
    if (t < 5) {
      // reveal: soft push toward the resort
      const k = smooth(Math.min(t / 5, 1));
      camera.position.set(0, 3.6 - k * 0.6, -14 - k * 4);
      camera.lookAt(1.5, 5.5 - k * 2, -55);
    } else if (t < 8.2) {
      // beaming close-up, held while the buddy waves, shouts, and hops
      const k = smooth(Math.min((t - 5) / 0.7, 1));
      const cx = 0.25, cy = 1.2, cz = PAD.z + 2.6;
      camera.position.set(lerp(0, cx, k), lerp(3.0, cy, k), lerp(-18, cz, k));
      camera.lookAt(0, 1.05, PAD.z);
    } else {
      // pull back to the gameplay camera
      const k = smooth(Math.min((t - 8.2) / 1.3, 1));
      camera.position.set(lerp(0.25, 0, k), lerp(1.2, 5.7, k), lerp(PAD.z + 2.6, PAD.z + 10.1, k));
      camera.lookAt(0, lerp(1.05, 1.2, k), PAD.z);
    }
  });

  return null;
}
