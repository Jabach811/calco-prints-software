// Charts are data: { time, lane }[] generated from a track's beat grid.
// Seeded so the same song+difficulty always deals the same chart — kids
// learn the patterns, that's the fun. Times use the track's `eighth`
// offset so swung songs chart on the swung grid the drums actually play.

const DIFF = {
  easy: { density: 0.45, off: 0, chord: 0 },
  medium: { density: 0.8, off: 0.25, chord: 0 },
  hard: { density: 1, off: 0.5, chord: 0.12 },
};

export function makeChart(track, difficulty) {
  const d = DIFF[difficulty];
  const spb = 60 / track.bpm;
  const totalBeats = track.bars * 4;
  let seed = track.seed * 7919 + { easy: 1, medium: 2, hard: 3 }[difficulty];
  const rnd = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed % 1000) / 1000; };
  const lane = () => Math.floor(rnd() * 4);
  const notes = [];
  const push = (beat, l) => notes.push({ time: +(beat * spb).toFixed(3), lane: l });
  let last = -1;
  for (let b = 4; b <= totalBeats - 2; b++) {
    if (rnd() >= d.density) continue;
    let l = lane();
    if (l === last && rnd() < 0.5) l = (l + 1 + Math.floor(rnd() * 3)) % 4; // break up runs
    push(b, l);
    last = l;
    if (rnd() < d.chord) push(b, (l + 1 + Math.floor(rnd() * 3)) % 4); // two at once
    if (rnd() < d.off && b < totalBeats - 2) push(b + track.eighth, (l + 2) % 4);
  }
  return notes;
}
