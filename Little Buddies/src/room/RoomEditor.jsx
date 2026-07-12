import React, { useEffect, useRef } from 'react';
import { ROOM_CATALOG, ROOM_SLOTS } from './roomCatalog.js';

export function compatibleRoomItems(slotId, inventory = []) {
  return ROOM_CATALOG.filter(
    (item) => item.slot === slotId && inventory.includes(item.id),
  );
}

export function roomSlotLabel(slotId) {
  return slotId ? slotId[0].toUpperCase() + slotId.slice(1) : '';
}

export function focusOnNextFrame(target, schedule = requestAnimationFrame) {
  if (!target) return;
  schedule(() => target.focus());
}

export function RoomEditor({ inventory, layout, editingSlot, onSelectSlot, onEquip, onRemove, onBack }) {
  const slotButtonRefs = useRef({});
  const previousSlotRef = useRef(null);
  const compatible = compatibleRoomItems(editingSlot, inventory);
  const equippedId = editingSlot ? layout?.[editingSlot] : null;

  useEffect(() => {
    const focusSlot = editingSlot ?? previousSlotRef.current;
    focusOnNextFrame(slotButtonRefs.current[focusSlot]);
    previousSlotRef.current = editingSlot;
  }, [editingSlot]);

  return (
    <section className="room-editor" aria-label="Room editor">
      <div className="room-slot-strip" role="group" aria-label="Room decoration slots">
        {ROOM_SLOTS.map((slotId) => (
          <button
            key={slotId}
            type="button"
            ref={(node) => { slotButtonRefs.current[slotId] = node; }}
            className="room-slot-button"
            aria-pressed={editingSlot === slotId}
            onClick={() => onSelectSlot(slotId)}
          >
            {roomSlotLabel(slotId)}
          </button>
        ))}
      </div>

      {editingSlot ? (
        <div className="room-item-panel">
          <div className="room-editor-heading">
            <h2>{roomSlotLabel(editingSlot)}</h2>
            <button type="button" className="room-back-button" onClick={onBack}>Back</button>
          </div>
          <div className="room-item-tray" aria-label={`${roomSlotLabel(editingSlot)} decorations`}>
            {compatible.length ? compatible.map((item) => (
              <button
                key={item.id}
                type="button"
                className="room-item-button"
                aria-pressed={equippedId === item.id}
                onClick={() => onEquip(editingSlot, item.id)}
              >
                <span className="room-item-swatch" style={{ '--room-item-color': item.render.color }} aria-hidden="true" />
                <span>{item.name}</span>
              </button>
            )) : <p className="room-empty">Empty — earn a decoration for this spot.</p>}
          </div>
          {equippedId && (
            <button type="button" className="room-remove-button" onClick={() => onRemove(editingSlot)}>
              Remove
            </button>
          )}
        </div>
      ) : (
        <p className="room-editor-hint">Choose a spot to decorate.</p>
      )}
    </section>
  );
}
