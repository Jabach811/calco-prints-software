import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Room 107 eager dependency boundary', () => {
  it('keeps store and HUD imports outside the visual room module tree', () => {
    const store = readFileSync(new URL('../state/store.js', import.meta.url), 'utf8');
    const hud = readFileSync(new URL('../ui/HUD.jsx', import.meta.url), 'utf8');

    expect(store).not.toMatch(/from ['"]\.\.\/room\//);
    expect(hud).not.toMatch(/from ['"]\.\.\/room\//);
    expect(store).toMatch(/from ['"]\.\/roomProgression\.js['"]/);
    expect(hud).toMatch(/from ['"]\.\.\/state\/roomProgression\.js['"]/);
  });
});
