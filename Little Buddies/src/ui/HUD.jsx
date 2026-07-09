// The full HUD per the UI mockups: player card, online pill, corner buttons,
// interaction card, phrase bar, toasts, progress cards.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../state/store.js';
import { byId } from '../data/interactables.js';
import { AMBIENT_NPCS, DESK_BUDDY, SNACK_BUDDY } from '../data/npcs.js';
import { STARTER_PHRASES, UNLOCK_PHRASES, EMOTES, STICKERS } from '../data/dialogue.js';
import { ACTION_COLORS } from '../data/palette.js';
import { drawPortrait } from './portrait.js';
import { isMuted, setMuted } from '../systems/audio.js';

const now = () => performance.now() / 1000;

export function Portrait({ profile, size = 56 }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) drawPortrait(ref.current, profile, size * 2);
  }, [profile, size]);
  return <canvas ref={ref} style={{ width: size, height: size, borderRadius: 14 }} />;
}

function PlayerCard() {
  const profile = useGame((s) => s.profile);
  const progress = useGame((s) => s.progress);
  const moodIcon = useGame((s) => s.moodIcon);
  const quest = progress.quests.find((q) => !q.done);
  const xpMax = progress.level * 100;
  return (
    <div className="hud-topleft">
      <div className="player-card">
        <Portrait profile={profile} />
        <div className="player-info">
          <div className="player-name">
            {profile.name} <span className="mood">{moodIcon}</span>
          </div>
          <div className="player-level">Level {progress.level}</div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${Math.min(100, (progress.xp / xpMax) * 100)}%` }} />
          </div>
        </div>
      </div>
      <div className="coin-pill">🪙 {progress.coins}</div>
      {quest && (
        <div className="quest-pill">
          🎯 {quest.label} <b>{quest.n}/{quest.target}</b>
        </div>
      )}
    </div>
  );
}

function OnlinePill() {
  const remotes = useGame((s) => s.remotes);
  const room = useGame((s) => s.room);
  const count = 12 + Object.keys(remotes).length;
  return (
    <div className="hud-topright">
      <div className="online-pill" key={count}>
        <span className="online-icon">👥</span>
        <span className="online-label">Buddies Online</span>
        <span className="online-count">{count}</span>
      </div>
      {room && <div className="room-chip">Room {room.code}</div>}
      <div className="top-buttons">
        <MuteButton />
        <button className="round-btn" title="Parents" onClick={() => useGame.getState().setPanel('parentOpen', true)}>🛡️</button>
      </div>
    </div>
  );
}

function MuteButton() {
  const [m, setM] = useState(isMuted());
  return (
    <button
      className="round-btn"
      title={m ? 'Sound on' : 'Sound off'}
      onClick={() => { setMuted(!m); setM(!m); }}
    >
      {m ? '🔇' : '🔊'}
    </button>
  );
}

function CornerButtons() {
  const setPanel = useGame((s) => s.setPanel);
  return (
    <div className="hud-bottomleft">
      <button className="big-btn" onClick={() => setPanel('backpackOpen', true)}>
        <span className="big-btn-icon">🎒</span>
        <span>Backpack</span>
      </button>
      <button className="big-btn" onClick={() => setPanel('homeOpen', true)}>
        <span className="big-btn-icon">🏠</span>
        <span>Home</span>
      </button>
      <button className="big-btn" onClick={() => setPanel('friendsOpen', true)}>
        <span className="big-btn-icon">👥</span>
        <span>Friends</span>
      </button>
    </div>
  );
}

function useTick(ms = 400) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

const BUDDY_ACTIONS = [
  { id: 'talk', label: 'Talk', color: 'blue', icon: '💬' },
  { id: 'gift', label: 'Gift', color: 'green', icon: '🎁' },
  { id: 'wave', label: 'Wave', color: 'yellow', icon: '👋' },
  { id: 'cheer', label: 'Hype', color: 'purple', icon: '🔥' },
];

function InteractionCard() {
  const nearId = useGame((s) => s.nearId);
  const cooldowns = useGame((s) => s.cooldowns);
  const remotes = useGame((s) => s.remotes);
  useTick(500);
  const [scrolled, setScrolled] = useState(false);
  const rowRef = useRef();

  const card = useMemo(() => {
    if (!nearId) return null;
    if (nearId.startsWith('buddy:')) {
      const id = nearId.slice(6);
      const npc = [...AMBIENT_NPCS, DESK_BUDDY, SNACK_BUDDY].find((n) => n.id === id);
      const profile = npc || remotes[id];
      if (!profile) return null;
      return {
        kind: 'buddy', id,
        name: profile.name || 'Buddy',
        profile,
        actions: BUDDY_ACTIONS.map((a) => ({ ...a, cooldown: 4 })),
      };
    }
    const obj = byId[nearId];
    if (!obj) return null;
    return { kind: 'object', id: nearId, name: obj.name, icon: obj.icon, actions: obj.actions };
  }, [nearId, remotes]);

  useEffect(() => setScrolled(false), [nearId]);
  if (!card) return null;

  const overflow = card.actions.length > 5;
  return (
    <div className="interaction-card" key={card.id}>
      <div className="card-header">
        {card.kind === 'buddy' ? (
          <div className="card-portrait"><Portrait profile={card.profile} size={40} /></div>
        ) : (
          <div className="card-icon">{card.icon}</div>
        )}
        <div>
          <div className="card-title">{card.name}</div>
          <div className="card-prompt">Pick a move</div>
        </div>
      </div>
      <div className="card-actions" ref={rowRef}>
        {card.actions.map((a) => {
          const key = card.kind === 'buddy' ? `buddy:${card.id}:${a.id}` : `${card.id}:${a.id}`;
          const remain = Math.max(0, (cooldowns[key] || 0) - now());
          return (
            <button
              key={a.id}
              className="action-btn"
              style={{ background: ACTION_COLORS[a.color] || ACTION_COLORS.blue }}
              disabled={remain > 0}
              onClick={() =>
                card.kind === 'buddy'
                  ? useGame.getState().doBuddyAction(card.id, a.id)
                  : useGame.getState().doAction(card.id, a.id)
              }
            >
              <span className="action-icon">{a.icon}</span>
              <span>{a.label}</span>
              {remain > 0 && <span className="cooldown">{Math.ceil(remain)}</span>}
            </button>
          );
        })}
        {overflow && !scrolled && (
          <button className="more-arrow" onClick={() => { rowRef.current?.scrollBy({ left: 160, behavior: 'smooth' }); setScrolled(true); }}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}

function ProgressCard() {
  const pc = useGame((s) => s.progressCard);
  useTick(80);
  if (!pc) return null;
  const k = Math.min(1, (now() - pc.t0) / pc.secs);
  return (
    <div className="progress-card">
      <div className="progress-label">💧 {pc.label}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${k * 100}%` }} />
      </div>
    </div>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={'toast' + (t.gold ? ' gold' : '')}>
          <span className="toast-icon">{t.icon}</span> {t.text}
        </div>
      ))}
    </div>
  );
}

function PhraseBar() {
  const progress = useGame((s) => s.progress);
  const safety = useGame((s) => s.safety);
  const [tab, setTab] = useState('phrases');
  const rowRef = useRef();
  const phrases = [...STARTER_PHRASES, ...UNLOCK_PHRASES].filter((p) => progress.phrases.includes(p.id));
  const stickers = STICKERS.filter((s) => progress.stickers.includes(s.id));

  return (
    <div className="hud-bottomright">
      <div className="bar-tabs">
        {safety.phraseBar && (
          <button className={'bar-tab' + (tab === 'phrases' ? ' active' : '')} onClick={() => setTab('phrases')}>💬</button>
        )}
        <button className={'bar-tab' + (tab === 'emotes' ? ' active' : '')} onClick={() => setTab('emotes')}>😊</button>
        <button className={'bar-tab' + (tab === 'stickers' ? ' active' : '')} onClick={() => setTab('stickers')}>⭐</button>
      </div>
      <div className="phrase-row-wrap">
        <div className="phrase-row" ref={rowRef}>
          {tab === 'phrases' && safety.phraseBar &&
            phrases.map((p) => (
              <button key={p.id} className="phrase-chip" onClick={() => useGame.getState().usePhrase(p.id)}>
                {p.text}
              </button>
            ))}
          {tab === 'emotes' &&
            EMOTES.map((e) => (
              <button key={e.id} className="phrase-chip" onClick={() => useGame.getState().useEmote(e.anim)}>
                {e.icon} {e.label}
              </button>
            ))}
          {tab === 'stickers' &&
            (stickers.length ? (
              stickers.map((s) => (
                <button key={s.id} className="phrase-chip" onClick={() => useGame.getState().useSticker(s.id)}>
                  {s.icon}
                </button>
              ))
            ) : (
              <span className="phrase-hint">Stickers drop out in the world. Go find some.</span>
            ))}
        </div>
        <button className="more-arrow bar-arrow" onClick={() => rowRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}>›</button>
      </div>
    </div>
  );
}

export function HUD() {
  return (
    <div className="hud">
      <PlayerCard />
      <OnlinePill />
      <CornerButtons />
      <div className="hud-bottomcenter">
        <Toasts />
        <ProgressCard />
        <InteractionCard />
      </div>
      <PhraseBar />
    </div>
  );
}
