import { describe, expect, it } from 'vitest';
import { createGrid } from './grid';
import {
  createHistory,
  drawPng,
  interpolateCells,
  pushHistory,
  redoHistory,
  safeLoadProject,
  undoHistory,
} from './runtime';

describe('history', () => {
  it('pushes one snapshot per gesture, supports undo/redo, and discards the redo branch', () => {
    const a = createGrid(16);
    const b = createGrid(16); b[0]![0] = '#111111';
    const c = createGrid(16); c[0]![1] = '#222222';
    let history = createHistory(a);
    history = pushHistory(history, b);
    history = pushHistory(history, c);
    let result = undoHistory(history);
    expect(result.current).toEqual(b);
    result = redoHistory(result);
    expect(result.current).toEqual(c);
    result = undoHistory(result);
    result = pushHistory(result, a);
    expect(redoHistory(result)).toBe(result);
  });

  it('does not add identical snapshots and caps retained undo states', () => {
    const grid = createGrid(16);
    expect(pushHistory(createHistory(grid), createGrid(16)).past).toHaveLength(0);
    let history = createHistory(grid);
    for (let index = 0; index < 110; index++) {
      const next = createGrid(16);
      next[0]![0] = `#${index.toString(16).padStart(6, '0')}`;
      history = pushHistory(history, next);
    }
    expect(history.past).toHaveLength(100);
  });
});

describe('pointer helpers', () => {
  it('interpolates every grid cell crossed by fast horizontal and diagonal movement', () => {
    expect(interpolateCells({ row: 2, col: 1 }, { row: 2, col: 4 })).toEqual([
      { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
    ]);
    expect(interpolateCells({ row: 0, col: 0 }, { row: 3, col: 3 })).toEqual([
      { row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 },
    ]);
  });
});

describe('safe persistence', () => {
  it('returns a valid saved project and reports malformed or unavailable storage', () => {
    const project = JSON.stringify({ version: 1, name: 'Saved', size: 16, cells: createGrid(16), updatedAt: '2026-07-15T12:00:00.000Z' });
    expect(safeLoadProject({ getItem: () => project }, 'key').project?.name).toBe('Saved');
    expect(safeLoadProject({ getItem: () => '{oops' }, 'key')).toEqual({ project: null, error: 'Saved project was invalid and was ignored.' });
    expect(safeLoadProject({ getItem: () => { throw new Error('denied'); } }, 'key')).toEqual({ project: null, error: 'Local storage is unavailable.' });
  });
});

describe('deterministic PNG drawing', () => {
  it('uses a fixed 64 pixels per bead and stable row-major fill order', () => {
    const grid = createGrid(16);
    grid[0]![1] = '#112233';
    grid[2]![0] = '#abcdef';
    const calls: unknown[][] = [];
    const context = {
      fillStyle: '',
      clearRect: (...args: unknown[]) => calls.push(['clear', ...args]),
      fillRect(...args: unknown[]) { calls.push(['fill', this.fillStyle, ...args]); },
    };
    const dimensions = drawPng(context, grid, 'transparent');
    expect(dimensions).toEqual({ width: 1024, height: 1024 });
    expect(calls).toEqual([
      ['clear', 0, 0, 1024, 1024],
      ['fill', '#112233', 64, 0, 64, 64],
      ['fill', '#abcdef', 0, 128, 64, 64],
    ]);
  });

  it('paints white first when requested', () => {
    const calls: unknown[][] = [];
    const context = { fillStyle: '', clearRect() {}, fillRect(...args: unknown[]) { calls.push([this.fillStyle, ...args]); } };
    drawPng(context, createGrid(24), 'white');
    expect(calls[0]).toEqual(['#ffffff', 0, 0, 1536, 1536]);
  });
});
