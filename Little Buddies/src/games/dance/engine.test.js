import { describe, it, expect } from 'vitest';
import { createEngine, maxScore, gradeFor, WINDOWS, POINTS, COMBO_BONUS, COMBO_MIN } from './engine.js';

const chart = (times, lane = 0) => times.map((time) => ({ time, lane }));

describe('tap judging', () => {
  it('judges a dead-on tap as perfect', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0).judgment).toBe('perfect');
  });
  it('judges within the perfect window as perfect', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0 + WINDOWS.perfect - 0.001).judgment).toBe('perfect');
  });
  it('judges between perfect and good windows as good', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0 + WINDOWS.perfect + 0.02).judgment).toBe('good');
  });
  it('ignores taps outside the good window', () => {
    const e = createEngine(chart([1.0]));
    expect(e.tap(0, 1.0 + WINDOWS.good + 0.05)).toBeNull();
    expect(e.notes[0].judged).toBeNull();
  });
  it('ignores taps on the wrong lane', () => {
    const e = createEngine(chart([1.0], 2));
    expect(e.tap(0, 1.0)).toBeNull();
  });
  it('hits the nearest unjudged note in the lane', () => {
    const e = createEngine(chart([1.0, 1.15]));
    const r = e.tap(0, 1.14);
    expect(r.note.time).toBe(1.15);
  });
  it('never judges the same note twice', () => {
    const e = createEngine(chart([1.0]));
    e.tap(0, 1.0);
    expect(e.tap(0, 1.0)).toBeNull();
  });
});

describe('misses via update()', () => {
  it('marks unhit notes as missed once past the good window', () => {
    const e = createEngine(chart([1.0]));
    expect(e.update(1.0 + WINDOWS.good + 0.01).length).toBe(1);
    expect(e.notes[0].judged).toBe('miss');
    expect(e.counts.miss).toBe(1);
  });
  it('does not miss notes still in the window', () => {
    const e = createEngine(chart([1.0]));
    expect(e.update(1.0 + WINDOWS.good - 0.01).length).toBe(0);
  });
  it('resets combo on a miss', () => {
    const e = createEngine(chart([1.0, 2.0]));
    e.tap(0, 1.0);
    expect(e.combo).toBe(1);
    e.update(3.0);
    expect(e.combo).toBe(0);
    expect(e.maxCombo).toBe(1);
  });
  it('sets done when every note is judged', () => {
    const e = createEngine(chart([1.0]));
    e.update(2.0);
    expect(e.done).toBe(true);
  });
});

describe('scoring', () => {
  it('scores perfect and good hits', () => {
    const e = createEngine(chart([1.0, 2.0]));
    e.tap(0, 1.0);
    e.tap(0, 2.0 + WINDOWS.perfect + 0.02);
    expect(e.score).toBe(POINTS.perfect + POINTS.good);
  });
  it(`adds the combo bonus from the ${COMBO_MIN}th consecutive hit`, () => {
    const times = Array.from({ length: COMBO_MIN }, (_, i) => i + 1);
    const e = createEngine(chart(times));
    times.forEach((t) => e.tap(0, t));
    expect(e.score).toBe(COMBO_MIN * POINTS.perfect + COMBO_BONUS);
  });
  it('computes maxScore as all-perfect with combo bonuses', () => {
    expect(maxScore(5)).toBe(5 * POINTS.perfect);
    expect(maxScore(12)).toBe(12 * POINTS.perfect + 3 * COMBO_BONUS);
  });
  it('grades on percentage boundaries', () => {
    expect(gradeFor(95, 100)).toBe('S');
    expect(gradeFor(94, 100)).toBe('A');
    expect(gradeFor(85, 100)).toBe('A');
    expect(gradeFor(70, 100)).toBe('B');
    expect(gradeFor(69, 100)).toBe('C');
    expect(gradeFor(0, 0)).toBe('C');
  });
});
