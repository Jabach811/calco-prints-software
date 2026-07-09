// Popups & panels: snack menu, mailbox gift, postcard, backpack, home stub,
// friends (invite-code multiplayer), parent controls.
import React, { useState } from 'react';
import { useGame } from '../state/store.js';
import { SNACKS, STICKERS, COLLECTIBLES } from '../data/dialogue.js';

function Modal({ title, onClose, children, small }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className={'modal' + (small ? ' small' : '')} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="round-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SnackMenu() {
  const open = useGame((s) => s.snackMenuOpen);
  const coins = useGame((s) => s.progress.coins);
  if (!open) return null;
  return (
    <div className="popup snack-menu">
      <div className="popup-title">Snack Stand</div>
      <div className="popup-sub">What’ll it be?</div>
      <div className="snack-row">
        {SNACKS.map((s) => (
          <button key={s.id} className="snack-item" onClick={() => useGame.getState().buySnack(s.id)}>
            <span className="snack-icon">{s.icon}</span>
            <span className="snack-name">{s.name}</span>
            <span className="snack-price">🪙 {s.price}</span>
          </button>
        ))}
      </div>
      <div className="snack-footer">
        <span className="coin-balance">🪙 {coins}</span>
        <button className="pill-btn" onClick={() => useGame.setState({ snackMenuOpen: false })}>Close</button>
      </div>
    </div>
  );
}

export function GiftPopup() {
  const gift = useGame((s) => s.giftPopup);
  if (!gift) return null;
  return (
    <div className="popup gift-popup">
      <div className="gift-icon">🎁</div>
      <div className="popup-title">{gift.text}</div>
      <button className="pill-btn gold-btn" onClick={() => useGame.getState().claimGift()}>Open</button>
    </div>
  );
}

export function Postcard() {
  const pc = useGame((s) => s.postcard);
  if (!pc) return null;
  return (
    <div className="popup postcard">
      <div className="popup-title">📬 Mail!</div>
      <div className="postcard-text">“{pc.text}”</div>
      <div className="postcard-from">— {pc.from}</div>
      <button className="pill-btn" onClick={() => useGame.setState({ postcard: null })}>Cool</button>
    </div>
  );
}

export function Backpack() {
  const open = useGame((s) => s.backpackOpen);
  const progress = useGame((s) => s.progress);
  const [tab, setTab] = useState('stickers');
  if (!open) return null;
  return (
    <Modal title="🎒 Backpack" onClose={() => useGame.getState().setPanel('backpackOpen', false)}>
      <div className="tab-row">
        {['stickers', 'collectibles', 'snacks'].map((t) => (
          <button key={t} className={'tab-btn' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>
            {t === 'stickers' ? '⭐ Stickers' : t === 'collectibles' ? '💎 Loot' : '🍕 Snacks'}
          </button>
        ))}
      </div>
      {tab === 'stickers' && (
        <div className="grid">
          {STICKERS.map((s) => {
            const owned = progress.stickers.includes(s.id);
            return (
              <button
                key={s.id}
                className={'grid-item' + (owned ? '' : ' locked')}
                onClick={() => owned && (useGame.getState().useSticker(s.id), useGame.getState().setPanel('backpackOpen', false))}
              >
                <span className="grid-icon">{owned ? s.icon : '❔'}</span>
                <span className="grid-name">{owned ? s.name : '???'}</span>
              </button>
            );
          })}
        </div>
      )}
      {tab === 'collectibles' && (
        <div className="grid">
          {COLLECTIBLES.map((c) => {
            const n = progress.collectibles[c.id] || 0;
            return (
              <div key={c.id} className={'grid-item' + (n ? '' : ' locked')}>
                <span className="grid-icon">{n ? c.icon : '❔'}</span>
                <span className="grid-name">{n ? `${c.name} ×${n}` : '???'}</span>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'snacks' && (
        <div className="grid">
          {SNACKS.map((c) => {
            const n = progress.snacks[c.id] || 0;
            return (
              <div key={c.id} className={'grid-item' + (n ? '' : ' locked')}>
                <span className="grid-icon">{c.icon}</span>
                <span className="grid-name">{c.name} ×{n}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="backpack-hint">Tap a sticker to use it.</div>
    </Modal>
  );
}

export function HomePanel() {
  const open = useGame((s) => s.homeOpen);
  if (!open) return null;
  return (
    <Modal title="🏠 Your Room" onClose={() => useGame.getState().setPanel('homeOpen', false)} small>
      <div className="home-door">
        <div className="door-shape">
          <div className="door-plaque">107</div>
          <div className="door-knob" />
        </div>
      </div>
      <div className="home-text">Room 107 is still under construction.<br />Coming soon.</div>
    </Modal>
  );
}

export function FriendsPanel() {
  const open = useGame((s) => s.friendsOpen);
  const room = useGame((s) => s.room);
  const remotes = useGame((s) => s.remotes);
  const netStatus = useGame((s) => s.netStatus);
  const safety = useGame((s) => s.safety);
  const [code, setCode] = useState('');
  if (!open) return null;
  const close = () => useGame.getState().setPanel('friendsOpen', false);
  return (
    <Modal title="👥 Play with Friends" onClose={close} small>
      {!safety.multiplayer ? (
        <div className="home-text">Multiplayer is turned off in Parent Controls.</div>
      ) : room ? (
        <div className="friends-live">
          <div className="invite-label">Your invite code</div>
          <div className="invite-code">{room.code}</div>
          <div className="friends-hint">Ask a parent to share this code with your friend's parent. They enter it here to join your room.</div>
          <div className="friends-list">
            {Object.entries(remotes).length === 0 ? (
              <div className="friends-empty">Waiting for friends…</div>
            ) : (
              Object.entries(remotes).map(([id, p]) => (
                <div key={id} className="friend-row">🟢 {p?.name || 'Buddy'}</div>
              ))
            )}
          </div>
          <button className="pill-btn" onClick={() => useGame.getState().leaveRoom()}>Leave Room</button>
        </div>
      ) : (
        <div className="friends-setup">
          <button className="pill-btn gold-btn" disabled={netStatus === 'connecting'} onClick={() => useGame.getState().hostRoom()}>
            {netStatus === 'connecting' ? 'Connecting…' : 'Create a Room'}
          </button>
          <div className="or-divider">or join a friend</div>
          <div className="join-row">
            <input
              className="code-input"
              value={code}
              maxLength={6}
              placeholder="CODE"
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
            <button
              className="pill-btn"
              disabled={code.length < 6 || netStatus === 'connecting'}
              onClick={() => useGame.getState().joinRoom(code)}
            >
              Join
            </button>
          </div>
          <div className="friends-hint">Friends only — no strangers, ever. Rooms hold up to 8 Buddies.</div>
        </div>
      )}
    </Modal>
  );
}

export function ParentPanel() {
  const open = useGame((s) => s.parentOpen);
  const safety = useGame((s) => s.safety);
  const [confirmReset, setConfirmReset] = useState(false);
  if (!open) return null;
  return (
    <Modal title="🛡️ Parent Controls" onClose={() => useGame.getState().setPanel('parentOpen', false)} small>
      <label className="toggle-row">
        <span>Multiplayer (friends-only rooms)</span>
        <input
          type="checkbox"
          checked={safety.multiplayer}
          onChange={(e) => {
            useGame.getState().setSafety({ multiplayer: e.target.checked });
            if (!e.target.checked) useGame.getState().leaveRoom();
          }}
        />
      </label>
      <label className="toggle-row">
        <span>Preset phrase bar</span>
        <input type="checkbox" checked={safety.phraseBar} onChange={(e) => useGame.getState().setSafety({ phraseBar: e.target.checked })} />
      </label>
      <div className="safety-note">
        There is no open chat, voice, or messaging anywhere in Little Buddies World.
        Kids can only use pre-written phrases, emotes, and stickers.
      </div>
      {confirmReset ? (
        <div className="reset-confirm">
          <span>Delete this Buddy and all progress?</span>
          <button className="pill-btn danger" onClick={() => useGame.getState().resetBuddy()}>Yes, delete</button>
          <button className="pill-btn" onClick={() => setConfirmReset(false)}>Cancel</button>
        </div>
      ) : (
        <button className="pill-btn danger" onClick={() => setConfirmReset(true)}>Delete Buddy…</button>
      )}
    </Modal>
  );
}

export function AllPanels() {
  return (
    <>
      <SnackMenu />
      <GiftPopup />
      <Postcard />
      <Backpack />
      <HomePanel />
      <FriendsPanel />
      <ParentPanel />
    </>
  );
}
