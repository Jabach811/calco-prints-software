// Dance Studio flow: song select → difficulty → playing overlay → results.
// The 3D stage lives in DanceStage.jsx; they share state via session.js.
import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/store.js';
import { sfx } from '../../systems/audio.js';
import { TRACKS, startTrack } from './tracks.js';
import { makeChart } from './charts.js';
import { createEngine, maxScore, gradeFor } from './engine.js';
import { danceSession, resetSession } from './session.js';

const KEYMAP = { ArrowLeft: 0, ArrowUp: 1, ArrowDown: 2, ArrowRight: 3 };
const PAD_CHARS = ['◀', '▲', '▼', '▶'];
const PAD_COLORS = ['#3D8BFD', '#FFD23F', '#54C24E', '#9B5DE5'];
const GRADE_LINES = {
  S: 'PERFECT STORM! The backup dancers want lessons.',
  A: 'So smooth. The floor is jealous.',
  B: 'Solid moves! A little more sparkle next time.',
  C: 'Hey, every legend starts somewhere.',
};

function doTap(lane) {
  if (!danceSession.active) return null;
  const t = danceSession.handle.songTime();
  const res = danceSession.engine.tap(lane, t);
  if (res) {
    danceSession.pops.push({ noteId: res.note.id, t: performance.now() });
    sfx(res.judgment === 'perfect' ? 'ding' : 'pop');
  }
  return res;
}

export function DanceUI() {
  const [phase, setPhase] = useState('select'); // select | difficulty | playing | results
  const [track, setTrack] = useState(null);
  const [result, setResult] = useState(null);

  const begin = (difficulty) => {
    const chart = makeChart(track, difficulty);
    danceSession.engine = createEngine(chart);
    danceSession.handle = startTrack(track);
    danceSession.track = track;
    danceSession.noteCount = chart.length;
    danceSession.pops = [];
    danceSession.active = true;
    setPhase('playing');
  };

  const finish = () => {
    const e = danceSession.engine;
    danceSession.active = false;
    danceSession.handle.stop();
    const grade = gradeFor(e.score, maxScore(danceSession.noteCount));
    const paid = useGame.getState().finishDance({
      grade,
      songId: danceSession.track.id,
      songName: danceSession.track.name,
    });
    setResult({ score: e.score, grade, maxCombo: e.maxCombo, counts: { ...e.counts }, ...paid });
    setPhase('results');
  };

  const bail = () => { // quit mid-song, no rewards
    if (danceSession.handle) danceSession.handle.stop();
    resetSession();
    setPhase('select');
  };

  if (phase === 'select') {
    return (
      <div className="arcade-screen">
        <div className="arcade-title">🕺 Dance Studio</div>
        <div className="arcade-sub">Pick your jam</div>
        <div className="arcade-tiles">
          {TRACKS.map((t) => (
            <button key={t.id} className="arcade-tile" onClick={() => { setTrack(t); setPhase('difficulty'); }}>
              <span className="tile-icon">{t.icon}</span>
              <span className="tile-name">{t.name}</span>
              <span className="tile-tag">{t.vibe} · {t.speed}</span>
            </button>
          ))}
        </div>
        <button className="arcade-back" onClick={() => useGame.getState().quitToArcade()}>← Arcade</button>
      </div>
    );
  }

  if (phase === 'difficulty') {
    return (
      <div className="arcade-screen">
        <div className="arcade-title">{track.icon} {track.name}</div>
        <div className="arcade-sub">How brave are we feeling?</div>
        <div className="arcade-tiles">
          {[
            ['easy', '🙂', 'Easy', 'Chill blobs only'],
            ['medium', '😼', 'Medium', 'The blobs mean business'],
            ['hard', '🔥', 'Hard', 'Blob avalanche'],
          ].map(([id, icon, name, tag]) => (
            <button key={id} className="arcade-tile" onClick={() => begin(id)}>
              <span className="tile-icon">{icon}</span>
              <span className="tile-name">{name}</span>
              <span className="tile-tag">{tag}</span>
            </button>
          ))}
        </div>
        <button className="arcade-back" onClick={() => setPhase('select')}>← Songs</button>
      </div>
    );
  }

  if (phase === 'playing') return <PlayingOverlay onFinish={finish} onBail={bail} />;

  return (
    <div className="arcade-screen">
      <div className={`dance-grade grade-${result.grade}`}>{result.grade}</div>
      <div className="arcade-title">{result.score} pts</div>
      <div className="arcade-sub">{GRADE_LINES[result.grade]}</div>
      <div className="dance-counts">
        ⭐ Perfect {result.counts.perfect} · 👍 Good {result.counts.good} · 💨 Miss {result.counts.miss} · 🔥 Best combo {result.maxCombo}
      </div>
      <div className="dance-counts">🪙 +{result.coins} coins{result.firstClear ? ' · 🪩 Disco Sticker unlocked!' : ''}</div>
      <div className="dance-result-btns">
        <button className="arcade-back" onClick={() => { resetSession(); setPhase('difficulty'); }}>Play again</button>
        <button className="arcade-back" onClick={() => { resetSession(); setPhase('select'); }}>Songs</button>
        <button className="arcade-back" onClick={() => { resetSession(); useGame.getState().quitToArcade(); }}>Arcade</button>
      </div>
    </div>
  );
}

function PlayingOverlay({ onFinish, onBail }) {
  const [hud, setHud] = useState({ score: 0, combo: 0, ready: true });
  const [judgment, setJudgment] = useState(null); // { word, kind, key }
  const judgeSeq = useRef(0);

  const showJudgment = (kind) => {
    const word = kind === 'perfect' ? 'Perfect!' : kind === 'good' ? 'Good!' : 'Miss';
    setJudgment({ word, kind, key: ++judgeSeq.current });
  };

  const tap = (lane) => {
    const res = doTap(lane);
    if (res) showJudgment(res.judgment);
  };

  useEffect(() => {
    let raf, tick = 0;
    const loop = () => {
      const s = danceSession;
      if (s.active) {
        const t = s.handle.songTime();
        const missed = s.engine.update(t);
        if (missed.length) showJudgment('miss');
        if (t > s.handle.duration + 0.6) { onFinish(); return; }
        if (++tick % 6 === 0) setHud({ score: s.engine.score, combo: s.engine.combo, ready: t < 0 });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const down = (e) => {
      const lane = KEYMAP[e.code];
      if (lane !== undefined && !e.repeat) { e.preventDefault(); tap(lane); }
    };
    window.addEventListener('keydown', down);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); };
  }, [onFinish]);

  return (
    <div className="dance-overlay">
      <div className="dance-score">
        <div className="dance-score-num">{hud.score}</div>
        {hud.combo >= 4 && <div className="dance-combo">{hud.combo} combo!</div>}
      </div>
      {hud.ready && <div className="dance-ready">Get ready…</div>}
      {judgment && (
        <div key={judgment.key} className={`dance-judgment j-${judgment.kind}`}>{judgment.word}</div>
      )}
      <div className="dance-pads">
        {PAD_CHARS.map((ch, lane) => (
          <button
            key={lane}
            className="dance-pad"
            style={{ background: PAD_COLORS[lane] }}
            onPointerDown={(e) => { e.preventDefault(); tap(lane); }}
          >
            {ch}
          </button>
        ))}
      </div>
      <button className="dance-bail" onClick={onBail}>✕</button>
    </div>
  );
}
