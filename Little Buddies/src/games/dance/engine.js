// Pure rhythm-game logic. Knows nothing about blobs, audio, or rendering.
// Times are seconds from beat 0 of the song; lanes are 0=left 1=up 2=down 3=right.

export const WINDOWS = { perfect: 0.09, good: 0.18 };
export const POINTS = { perfect: 100, good: 60 };
export const COMBO_BONUS = 10; // extra points per hit while combo >= COMBO_MIN
export const COMBO_MIN = 10;

export function createEngine(chart) {
  const notes = chart.map((n, i) => ({ time: n.time, lane: n.lane, id: i, judged: null }));
  const e = {
    notes,
    score: 0,
    combo: 0,
    maxCombo: 0,
    counts: { perfect: 0, good: 0, miss: 0 },
    done: false,

    // player tapped `lane` at song-time `t` → judge the nearest live note, or null
    tap(lane, t) {
      let best = null;
      for (const n of notes) {
        if (n.judged || n.lane !== lane) continue;
        const d = Math.abs(n.time - t);
        if (d <= WINDOWS.good && (!best || d < Math.abs(best.time - t))) best = n;
      }
      if (!best) return null;
      const judgment = Math.abs(best.time - t) <= WINDOWS.perfect ? 'perfect' : 'good';
      best.judged = judgment;
      e.combo += 1;
      e.maxCombo = Math.max(e.maxCombo, e.combo);
      e.counts[judgment] += 1;
      e.score += POINTS[judgment] + (e.combo >= COMBO_MIN ? COMBO_BONUS : 0);
      return { judgment, note: best };
    },

    // call every frame with current song-time; returns newly missed notes
    update(t) {
      const missed = [];
      for (const n of notes) {
        if (!n.judged && n.time + WINDOWS.good < t) {
          n.judged = 'miss';
          e.counts.miss += 1;
          e.combo = 0;
          missed.push(n);
        }
      }
      if (!e.done && notes.every((n) => n.judged)) e.done = true;
      return missed;
    },
  };
  return e;
}

// best possible score: all perfect, combo bonus from the COMBO_MIN-th hit onward
export function maxScore(noteCount) {
  return noteCount * POINTS.perfect + Math.max(0, noteCount - (COMBO_MIN - 1)) * COMBO_BONUS;
}

export function gradeFor(score, max) {
  const p = max ? score / max : 0;
  return p >= 0.95 ? 'S' : p >= 0.85 ? 'A' : p >= 0.7 ? 'B' : 'C';
}
