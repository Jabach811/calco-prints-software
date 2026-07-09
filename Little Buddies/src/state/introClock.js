// Shared clock for the intro cinematic — read by both the 3D camera driver
// and the DOM curtain overlay so they stay in sync. t0 === 0 means "not armed".
export const introClock = { t0: 0, skipped: false };

export function startIntro() {
  introClock.t0 = performance.now();
  introClock.skipped = false;
}

export function introElapsed() {
  return (performance.now() - introClock.t0) / 1000;
}
