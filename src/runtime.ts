import { cloneGrid, parseProject, type Grid, type ProjectData } from './grid';

const HISTORY_LIMIT = 100;
const PNG_CELL_SIZE = 64;

export interface History {
  past: Grid[];
  current: Grid;
  future: Grid[];
}

export interface CellPosition {
  row: number;
  col: number;
}

interface StorageReader {
  getItem(key: string): string | null;
}

export interface DeferredPersistence {
  schedule(): void;
  flush(): void;
}

interface DrawingContext {
  canvas: { width: number; height: number };
  fillStyle: unknown;
  clearRect(x: number, y: number, width: number, height: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
}

export function createHistory(grid: Grid): History {
  return { past: [], current: cloneGrid(grid), future: [] };
}

export function pushHistory(history: History, next: Grid): History {
  if (JSON.stringify(history.current) === JSON.stringify(next)) return history;
  return {
    past: [...history.past, cloneGrid(history.current)].slice(-HISTORY_LIMIT),
    current: cloneGrid(next),
    future: [],
  };
}

export function undoHistory(history: History): History {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    current: cloneGrid(previous),
    future: [cloneGrid(history.current), ...history.future],
  };
}

export function redoHistory(history: History): History {
  const [next, ...future] = history.future;
  if (!next) return history;
  return {
    past: [...history.past, cloneGrid(history.current)].slice(-HISTORY_LIMIT),
    current: cloneGrid(next),
    future,
  };
}

export function interpolateCells(from: CellPosition, to: CellPosition): CellPosition[] {
  const cells: CellPosition[] = [];
  let col = from.col;
  let row = from.row;
  const colDistance = Math.abs(to.col - from.col);
  const rowDistance = Math.abs(to.row - from.row);
  const colStep = from.col < to.col ? 1 : -1;
  const rowStep = from.row < to.row ? 1 : -1;
  let error = colDistance - rowDistance;

  while (true) {
    cells.push({ row, col });
    if (row === to.row && col === to.col) break;
    const doubledError = error * 2;
    if (doubledError > -rowDistance) {
      error -= rowDistance;
      col += colStep;
    }
    if (doubledError < colDistance) {
      error += colDistance;
      row += rowStep;
    }
  }
  return cells;
}

export function safeLoadProject(getStorage: () => StorageReader, key: string): { project: ProjectData | null; error?: string } {
  try {
    const saved = getStorage().getItem(key);
    if (saved === null) return { project: null };
    try {
      return { project: parseProject(saved) };
    } catch {
      return { project: null, error: 'Saved project was invalid and was ignored.' };
    }
  } catch {
    return { project: null, error: 'Local storage is unavailable.' };
  }
}

export function createDeferredPersistence(
  save: () => void,
  setTimer: (callback: () => void, delay: number) => number,
  clearTimer: (timer: number) => void,
  delay: number,
): DeferredPersistence {
  let pendingTimer: number | undefined;
  let generation = 0;

  return {
    schedule() {
      if (pendingTimer !== undefined) clearTimer(pendingTimer);
      const scheduledGeneration = ++generation;
      pendingTimer = setTimer(() => {
        if (pendingTimer === undefined || scheduledGeneration !== generation) return;
        pendingTimer = undefined;
        save();
      }, delay);
    },
    flush() {
      if (pendingTimer === undefined) return;
      clearTimer(pendingTimer);
      pendingTimer = undefined;
      generation += 1;
      save();
    },
  };
}

export function drawPng(context: DrawingContext, grid: Grid, background: 'transparent' | 'white'): { width: number; height: number } {
  const width = grid.length * PNG_CELL_SIZE;
  const height = grid.length * PNG_CELL_SIZE;
  context.canvas.width = width;
  context.canvas.height = height;
  context.clearRect(0, 0, width, height);
  if (background === 'white') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  grid.forEach((row, rowIndex) => row.forEach((color, colIndex) => {
    if (!color) return;
    context.fillStyle = color;
    context.beginPath();
    context.arc(
      colIndex * PNG_CELL_SIZE + PNG_CELL_SIZE / 2,
      rowIndex * PNG_CELL_SIZE + PNG_CELL_SIZE / 2,
      PNG_CELL_SIZE * 0.43,
      0,
      Math.PI * 2,
    );
    context.fill();
  }));
  return { width, height };
}
