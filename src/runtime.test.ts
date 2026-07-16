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
  function drawingContext(calls: unknown[][]) {
    return {
      canvas: { width: 0, height: 0 },
      fillStyle: '',
      clearRect: (...args: unknown[]) => calls.push(['clear', ...args]),
      fillRect(...args: unknown[]) { calls.push(['rect', this.fillStyle, ...args]); },
      beginPath: () => calls.push(['begin']),
      arc: (...args: unknown[]) => calls.push(['arc', ...args]),
      fill() { calls.push(['fill', this.fillStyle]); },
    };
  }

  it('sizes the canvas at 64 pixels per bead and draws circles in stable row-major order', () => {
    const grid = createGrid(16);
    grid[0]![1] = '#112233';
    grid[2]![0] = '#abcdef';
    const calls: unknown[][] = [];
    const context = drawingContext(calls);
    const dimensions = drawPng(context, grid, 'transparent');
    expect(dimensions).toEqual({ width: 1024, height: 1024 });
    expect(context.canvas).toEqual({ width: 1024, height: 1024 });
    expect(calls).toEqual([
      ['clear', 0, 0, 1024, 1024],
      ['begin'], ['arc', 96, 32, 27.52, 0, Math.PI * 2], ['fill', '#112233'],
      ['begin'], ['arc', 32, 160, 27.52, 0, Math.PI * 2], ['fill', '#abcdef'],
    ]);
  });

  it('paints white first when requested', () => {
    const calls: unknown[][] = [];
    drawPng(drawingContext(calls), createGrid(24), 'white');
    expect(calls[1]).toEqual(['rect', '#ffffff', 0, 0, 1536, 1536]);
  });
});
