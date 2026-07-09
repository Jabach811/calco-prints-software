// Shared input runtime: keyboard, virtual joystick, click-to-move target, orbit drag.
export const inputRt = {
  keys: {},
  joy: { x: 0, z: 0, active: false },
  target: null, // {x, z}
  dragging: false,
  lastPointer: { x: 0, y: 0 },
  pinchDist: 0,
};

export function bindKeyboard() {
  const down = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    inputRt.keys[e.code] = true;
  };
  const up = (e) => { inputRt.keys[e.code] = false; };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

export function moveVector() {
  const k = inputRt.keys;
  let x = 0, z = 0;
  if (k.KeyW || k.ArrowUp) z -= 1;
  if (k.KeyS || k.ArrowDown) z += 1;
  if (k.KeyA || k.ArrowLeft) x -= 1;
  if (k.KeyD || k.ArrowRight) x += 1;
  if (inputRt.joy.active) { x += inputRt.joy.x; z += inputRt.joy.z; }
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return [x, z];
}
