import { describe, expect, it } from 'vitest';
import { createGrid } from './grid';
import {
  createDeferredPersistence,
  createHistory,
  drawPng,
  gridNavigationTarget,
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

describe('keyboard grid navigation', () => {
  it('moves with arrow keys and Home/End without leaving the grid', () => {
    expect(gridNavigationTarget({ row: 2, col: 3 }, 'ArrowUp', 4)).toEqual({ row: 1, col: 3 });
    expect(gridNavigationTarget({ row: 2, col: 3 }, 'ArrowDown', 4)).toEqual({ row: 3, col: 3 });
    expect(gridNavigationTarget({ row: 2, col: 3 }, 'ArrowLeft', 4)).toEqual({ row: 2, col: 2 });
    expect(gridNavigationTarget({ row: 2, col: 3 }, 'ArrowRight', 4)).toEqual({ row: 2, col: 3 });
    expect(gridNavigationTarget({ row: 2, col: 3 }, 'Home', 4)).toEqual({ row: 2, col: 0 });
    expect(gridNavigationTarget({ row: 2, col: 0 }, 'End', 4)).toEqual({ row: 2, col: 3 });
    expect(gridNavigationTarget({ row: 0, col: 0 }, 'ArrowUp', 4)).toEqual({ row: 0, col: 0 });
  });

  it('returns null for keys that are not grid navigation commands', () => {
    expect(gridNavigationTarget({ row: 1, col: 1 }, 'Enter', 4)).toBeNull();
    expect(gridNavigationTarget({ row: 1, col: 1 }, 'a', 4)).toBeNull();
  });
});

describe('safe persistence', () => {
  it('returns a valid saved project and reports malformed or unavailable storage', () => {
    const project = JSON.stringify({ version: 1, name: 'Saved', size: 16, cells: createGrid(16), updatedAt: '2026-07-15T12:00:00.000Z' });
    expect(safeLoadProject(() => ({ getItem: () => project }), 'key').project?.name).toBe('Saved');
    expect(safeLoadProject(() => ({ getItem: () => '{oops' }), 'key')).toEqual({ project: null, error: 'Saved project was invalid and was ignored.' });
    expect(safeLoadProject(() => ({ getItem: () => { throw new Error('denied'); } }), 'key')).toEqual({ project: null, error: 'Local storage is unavailable.' });
  });

  it('reports unavailable storage when acquiring the storage object throws', () => {
    expect(safeLoadProject(() => { throw new DOMException('denied', 'SecurityError'); }, 'key')).toEqual({
      project: null,
      error: 'Local storage is unavailable.',
    });
  });

  it('flushes the latest pending save synchronously and cancels its timer without saving twice', () => {
    let latest = 'first';
    const saved: string[] = [];
    const timers = new Map<number, () => void>();
    let nextTimer = 0;
    const persistence = createDeferredPersistence(
      () => saved.push(latest),
      callback => {
        const timer = ++nextTimer;
        timers.set(timer, callback);
        return timer;
      },
      timer => timers.delete(timer),
      250,
    );

    persistence.schedule();
    latest = 'latest';
    persistence.schedule();
    expect(timers.size).toBe(1);

    persistence.flush();
    expect(saved).toEqual(['latest']);
    expect(timers.size).toBe(0);

    timers.forEach(callback => callback());
    expect(saved).toEqual(['latest']);
  });

  it('ignores a superseded timer callback that was already queued', () => {
    const saved: string[] = [];
    const timers = new Map<number, () => void>();
    let nextTimer = 0;
    const persistence = createDeferredPersistence(
      () => saved.push('saved'),
      callback => {
        const timer = ++nextTimer;
        timers.set(timer, callback);
        return timer;
      },
      () => {},
      250,
    );

    persistence.schedule();
    persistence.schedule();
    timers.get(1)?.();
    expect(saved).toEqual([]);

    timers.get(2)?.();
    expect(saved).toEqual(['saved']);
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
    expect(calls).toEqual([
      ['clear', 0, 0, 1536, 1536],
      ['rect', '#ffffff', 0, 0, 1536, 1536],
    ]);
  });
});
