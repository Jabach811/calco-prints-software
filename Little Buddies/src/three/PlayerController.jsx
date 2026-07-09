// The player's Buddy: movement, damped orbit camera, proximity detection,
// bench sitting, pool swimming, float riding, and the big slide ride.
import * as THREE from 'three';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Buddy, BuddyBubble } from './Buddy.jsx';
import { playerRt, camRt } from '../state/rt.js';
import { inputRt, bindKeyboard, moveVector } from '../state/input.js';
import { resolveCollisions } from './colliders.js';
import { isInPool, SLIDE_CURVE, CLIMB_PATH } from './PoolSlide.jsx';
import { KIDDIE_CLIMB_CURVE, KIDDIE_SLIDE_CURVE } from './Zones.jsx';
import { INTERACTABLES, byId } from '../data/interactables.js';
import { AMBIENT_NPCS } from '../data/npcs.js';
import { remoteRts } from '../state/rt.js';
import { useGame } from '../state/store.js';
import { sfx } from '../systems/audio.js';

const now = () => performance.now() / 1000;
const SPEED = 5.2;

export function PlayerController({ cinematic }) {
  const root = useRef();
  const { camera, gl } = useThree();
  const profile = useGame((s) => s.profile);
  const bubble = useGame((s) => s.bubbles.me);
  const rideRequest = useGame((s) => s.rideRequest);
  const sitRequest = useGame((s) => s.sitRequest);
  const floatRequest = useGame((s) => s.floatRequest);
  const animReq = useGame((s) => s.playerAnimReq);
  const ride = useRef(null); // {phase:'climb'|'slide', t0}
  const oneShot = useRef(null); // {anim, until}
  const marker = useRef();

  useEffect(() => bindKeyboard(), []);

  // pointer orbit / pinch / click-to-move plumbing on the canvas
  useEffect(() => {
    const el = gl.domElement;
    let downAt = null;
    let moved = false;
    const onDown = (e) => {
      if (e.target !== el) return;
      downAt = { x: e.clientX, y: e.clientY };
      moved = false;
      inputRt.dragging = true;
      inputRt.lastPointer = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e) => {
      if (!inputRt.dragging) return;
      const dx = e.clientX - inputRt.lastPointer.x;
      const dy = e.clientY - inputRt.lastPointer.y;
      inputRt.lastPointer = { x: e.clientX, y: e.clientY };
      if (Math.abs(e.clientX - (downAt?.x || 0)) + Math.abs(e.clientY - (downAt?.y || 0)) > 6) moved = true;
      camRt.yaw -= dx * 0.005;
      camRt.pitch = THREE.MathUtils.clamp(camRt.pitch + dy * 0.003, 0.15, 0.85);
    };
    const onUp = (e) => {
      inputRt.dragging = false;
      // click-to-move: a non-drag release on the canvas walks to that spot
      if (downAt && e.target === el && Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) < 7) {
        const rect = el.getBoundingClientRect();
        const ndc = {
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        };
        const ray = new THREE.Raycaster();
        ray.setFromCamera(ndc, camera);
        const k = -ray.ray.origin.y / ray.ray.direction.y; // hit the y=0 ground plane
        if (k > 0) {
          const p = ray.ray.origin.clone().addScaledVector(ray.ray.direction, k);
          if (Math.hypot(p.x, p.z) < 105) inputRt.target = { x: p.x, z: p.z };
        }
      }
      downAt = null;
    };
    const onWheel = (e) => {
      camRt.dist = THREE.MathUtils.clamp(camRt.dist + e.deltaY * 0.01, 6, 20);
    };
    // touch pinch
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (inputRt.pinchDist) {
          camRt.dist = THREE.MathUtils.clamp(camRt.dist - (d - inputRt.pinchDist) * 0.03, 6, 20);
        }
        inputRt.pinchDist = d;
      }
    };
    const onTouchEnd = () => { inputRt.pinchDist = 0; };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl]);

  // E-to-interact: first action of the nearest card
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'KeyE') return;
      const s = useGame.getState();
      if (s.nearId && !s.nearId.startsWith('buddy:')) {
        const obj = byId[s.nearId];
        if (obj) s.doAction(s.nearId, obj.actions[0].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // one-shot anim requests from the store (emotes, action anims)
  useEffect(() => {
    if (!animReq) return;
    oneShot.current = { anim: animReq.anim === 'sitdown' ? 'sit' : animReq.anim, until: now() + animReq.secs };
  }, [animReq]);

  // bench sitting
  useEffect(() => {
    if (!sitRequest) return;
    playerRt.sitting = sitRequest.id;
    playerRt.x = sitRequest.spot[0];
    playerRt.z = sitRequest.spot[1];
    playerRt.ry = sitRequest.face;
    inputRt.target = null;
  }, [sitRequest]);

  // float riding
  useEffect(() => {
    if (!floatRequest) return;
    const obj = byId[floatRequest.id];
    if (!obj) return;
    playerRt.onFloat = floatRequest.id;
    playerRt.x = obj.pos[0];
    playerRt.z = obj.pos[1];
    inputRt.target = null;
  }, [floatRequest]);

  // the slide ride
  useEffect(() => {
    if (!rideRequest) return;
    ride.current = { phase: 'climb', t0: now(), kiddie: rideRequest.id === 'kiddie-slide' };
    playerRt.riding = true;
    inputRt.target = null;
    sfx('whoosh');
  }, [rideRequest]);

  const climbCurve = useMemo(
    () => new THREE.CatmullRomCurve3(CLIMB_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    []
  );

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = now();

    // ----- movement -----
    if (!cinematic && !playerRt.riding) {
      // keys/joystick are screen-relative: rotate into world space by camera yaw
      const [ix, iz] = moveVector();
      const cy = camRt.yaw;
      let wx = ix * Math.cos(cy) - iz * Math.sin(cy);
      let wz = ix * Math.sin(cy) + iz * Math.cos(cy);
      // click-to-move target is already a world position — head straight for it
      if (inputRt.target) {
        const dx = inputRt.target.x - playerRt.x;
        const dz = inputRt.target.z - playerRt.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.5) inputRt.target = null;
        else if (Math.abs(ix) + Math.abs(iz) < 0.01) {
          wx = dx / d; wz = dz / d;
        }
      }
      const inputActive = Math.abs(wx) + Math.abs(wz) > 0.02;
      if (inputActive) {
        const spd = playerRt.swimming ? SPEED * 0.55 : SPEED;
        let nx = playerRt.x + wx * spd * dt;
        let nz = playerRt.z + wz * spd * dt;
        [nx, nz] = resolveCollisions(nx, nz);
        playerRt.x = nx; playerRt.z = nz;
        playerRt.ry = Math.atan2(wx, wz);
        playerRt.sitting = null;
        playerRt.onFloat = null;
        if (useGame.getState().sitRequest) useGame.setState({ sitRequest: null, floatRequest: null });
      }
      playerRt.swimming = isInPool(playerRt.x, playerRt.z);

      // pick anim
      const os = oneShot.current;
      if (os && os.until > t) {
        if (playerRt.anim !== os.anim) { playerRt.anim = os.anim; playerRt.animT = 0; }
      } else {
        let anim = 'idle';
        if (playerRt.onFloat) anim = 'float';
        else if (playerRt.sitting) anim = 'sit';
        else if (playerRt.swimming) anim = 'swim';
        else if (inputActive) anim = 'walk';
        if (playerRt.anim !== anim) { playerRt.anim = anim; playerRt.animT = 0; }
      }
      playerRt.y = playerRt.swimming && !playerRt.onFloat ? -0.05 : playerRt.onFloat ? 0.35 : 0;
    }

    // ----- slide ride sequence -----
    if (ride.current) {
      const r = ride.current;
      const K = r.kiddie
        ? { climb: KIDDIE_CLIMB_CURVE, slide: KIDDIE_SLIDE_CURVE, climbT: 1.6, slideT: 1.6, sink: 0.05, xp: 6, coins: 1, toast: 'Wheee! +6 XP', endSfx: 'chime', shake: 0.25 }
        : { climb: climbCurve, slide: SLIDE_CURVE, climbT: 2.4, slideT: 3.6, sink: 0.6, xp: 12, coins: 2, toast: 'What a ride! +12 XP', endSfx: 'splash', shake: 0.5 };
      const el = t - r.t0;
      if (r.phase === 'climb') {
        const k = Math.min(el / K.climbT, 1);
        const p = K.climb.getPoint(k);
        playerRt.x = p.x; playerRt.y = p.y; playerRt.z = p.z;
        const tan = K.climb.getTangent(Math.min(k + 0.01, 1));
        playerRt.ry = Math.atan2(tan.x, tan.z);
        if (playerRt.anim !== 'walk') { playerRt.anim = 'walk'; playerRt.animT = 0; }
        if (k >= 1) { r.phase = 'slide'; r.t0 = t; sfx('whoosh'); useGame.getState().showBubble('me', 'Wheee!', 2); }
      } else {
        const k = Math.min(el / K.slideT, 1);
        const ease = k < 0.3 ? k * k / 0.3 * 3.33 * 0.3 : k; // slight accel
        const p = K.slide.getPoint(ease);
        playerRt.x = p.x; playerRt.y = p.y - K.sink; playerRt.z = p.z;
        const tan = K.slide.getTangent(Math.min(ease + 0.01, 1));
        playerRt.ry = Math.atan2(tan.x, tan.z);
        if (playerRt.anim !== 'ride') { playerRt.anim = 'ride'; playerRt.animT = 0; }
        if (k >= 1) {
          ride.current = null;
          playerRt.riding = false;
          playerRt.y = 0;
          camRt.shake = K.shake;
          sfx(K.endSfx);
          useGame.getState().award({ xp: K.xp, coins: K.coins, quiet: true });
          useGame.getState().addToast(K.toast, '🛝');
        }
      }
    }

    // ----- proximity: nearest interactable or buddy -----
    if (!cinematic && !playerRt.riding) {
      let best = null, bestD = 1e9;
      for (const o of INTERACTABLES) {
        const d = Math.hypot(o.pos[0] - playerRt.x, o.pos[1] - playerRt.z);
        if (d < o.radius && d < bestD) { best = o.id; bestD = d; }
      }
      if (!best) {
        for (const n of AMBIENT_NPCS) {
          if (n.behavior === 'balcony') continue;
          const rt = window.__npcRts?.[n.id];
          const nx = rt ? rt.x : n.pos[0];
          const nz = rt ? rt.z : n.pos[2];
          const d = Math.hypot(nx - playerRt.x, nz - playerRt.z);
          if (d < 3.2 && d < bestD) { best = 'buddy:' + n.id; bestD = d; }
        }
        for (const [id] of remoteRts) {
          const rt = remoteRts.get(id);
          const d = Math.hypot(rt.x - playerRt.x, rt.z - playerRt.z);
          if (d < 3.2 && d < bestD) { best = 'buddy:' + id; bestD = d; }
        }
      }
      useGame.getState().setNear(best);
    }

    // ----- move the mesh -----
    if (root.current) {
      root.current.position.set(playerRt.x, playerRt.y, playerRt.z);
      root.current.rotation.y = playerRt.ry;
    }

    // ----- click-to-move marker -----
    if (marker.current) {
      marker.current.visible = !!inputRt.target;
      if (inputRt.target) {
        marker.current.position.set(inputRt.target.x, 0.04, inputRt.target.z);
        marker.current.rotation.z = state.clock.elapsedTime * 2;
        marker.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.12);
      }
    }

    // ----- camera -----
    if (!cinematic) {
      const target = new THREE.Vector3(playerRt.x, playerRt.y + 1.2, playerRt.z);
      const off = new THREE.Vector3(
        Math.sin(camRt.yaw) * Math.cos(camRt.pitch),
        Math.sin(camRt.pitch),
        Math.cos(camRt.yaw) * Math.cos(camRt.pitch)
      ).multiplyScalar(camRt.dist);
      const desired = target.clone().add(off);
      const k = 1 - Math.exp(-dt * 5);
      camera.position.lerp(desired, k);
      if (camRt.shake > 0.01) {
        camera.position.x += (Math.random() - 0.5) * camRt.shake * 0.4;
        camera.position.y += (Math.random() - 0.5) * camRt.shake * 0.3;
        camRt.shake *= Math.exp(-dt * 4);
      }
      camera.lookAt(target);
    }
  });

  return (
    <>
      <group ref={root} position={[0, 0, -34]}>
        <Buddy profile={profile} rt={playerRt} />
        <BuddyBubble bubble={bubble} distanceFactor={cinematic ? undefined : 13} />
      </group>
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.5, 0.7, 20]} />
        <meshBasicMaterial color="#fff3b0" transparent opacity={0.85} />
      </mesh>
    </>
  );
}

