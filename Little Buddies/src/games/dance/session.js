// Mutable dance-session runtime shared between the DOM UI and the 3D stage,
// same idiom as state/rt.js. The stage reads this every frame.
export const danceSession = {
  active: false,
  engine: null, // from createEngine()
  handle: null, // from startTrack()
  track: null,
  noteCount: 0,
  pops: [], // [{ noteId, t }] recent hits, for the stage pop animation
};

export function resetSession() {
  danceSession.active = false;
  danceSession.engine = null;
  danceSession.handle = null;
  danceSession.track = null;
  danceSession.noteCount = 0;
  danceSession.pops = [];
}
