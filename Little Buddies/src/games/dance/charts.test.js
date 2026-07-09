import { describe, it, expect } from 'vitest';
import { makeChart } from './charts.js';

// minimal stand-in for a track definition
const track = { bpm: 120, bars: 30, seed: 42, eighth: 0.5 };
const spb = 60 / track.bpm;

describe('makeChart', () => {
  it('is deterministic for the same track and difficulty', () => {
    expect(makeChart(track, 'medium')).toEqual(makeChart(track, 'medium'));
  });
  it('gets denser with difficulty', () => {
    const e = makeChart(track, 'easy').length;
    const m = makeChart(track, 'medium').length;
    const h = makeChart(track, 'hard').length;
    expect(e).toBeLessThan(m);
    expect(m).toBeLessThan(h);
    expect(e).toBeGreaterThan(10);
  });
  it('only uses lanes 0-3 and non-decreasing times', () => {
    const c = makeChart(track, 'hard');
    for (let i = 0; i < c.length; i++) {
      expect(c[i].lane).toBeGreaterThanOrEqual(0);
      expect(c[i].lane).toBeLessThanOrEqual(3);
      if (i) expect(c[i].time).toBeGreaterThanOrEqual(c[i - 1].time);
    }
  });
  it('leaves a 4-beat count-in and 2-beat outro', () => {
    const c = makeChart(track, 'hard');
    expect(c[0].time).toBeGreaterThanOrEqual(4 * spb - 1e-9);
    expect(c[c.length - 1].time).toBeLessThanOrEqual((track.bars * 4 - 1) * spb + 1e-9);
  });
  it('never stacks two notes on the same time AND lane', () => {
    const c = makeChart(track, 'hard');
    const keys = new Set(c.map((n) => `${n.time}:${n.lane}`));
    expect(keys.size).toBe(c.length);
  });
});
