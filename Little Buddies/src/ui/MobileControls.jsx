// Left-thumb virtual joystick for touch devices.
import React, { useEffect, useRef, useState } from 'react';
import { inputRt } from '../state/input.js';

export function MobileControls() {
  const [touch, setTouch] = useState(false);
  const baseRef = useRef();
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    const check = () => setTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
  }, []);

  if (!touch) return null;

  const start = (e) => {
    const t = e.touches[0];
    const rect = baseRef.current.getBoundingClientRect();
    handle(t, rect);
  };
  const move = (e) => {
    const t = e.touches[0];
    const rect = baseRef.current.getBoundingClientRect();
    handle(t, rect);
  };
  const handle = (t, rect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = (t.clientX - cx) / (rect.width / 2);
    let dy = (t.clientY - cy) / (rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    inputRt.joy = { x: dx, z: dy, active: true };
    setKnob({ x: dx * 34, y: dy * 34, active: true });
  };
  const end = () => {
    inputRt.joy = { x: 0, z: 0, active: false };
    setKnob({ x: 0, y: 0, active: false });
  };

  return (
    <div
      className="joystick"
      ref={baseRef}
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
