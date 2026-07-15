export type Cell = string | null;
export type Grid = Cell[][];
export interface ProjectData { version: 1; name: string; size: number; cells: Grid; updatedAt: string }

export const createGrid = (size: number, fill: Cell = null): Grid =>
  Array.from({ length: size }, () => Array<Cell>(size).fill(fill));

export const cloneGrid = (grid: Grid): Grid => grid.map(row => [...row]);

export function paintCell(grid: Grid, row: number, col: number, color: Cell, mirrorH = false, mirrorV = false): Grid {
  const next = cloneGrid(grid);
  const size = next.length;
  if (row < 0 || col < 0 || row >= size || col >= size) return next;
  const points = new Set([`${row},${col}`]);
  if (mirrorH) points.add(`${row},${size - 1 - col}`);
  if (mirrorV) points.add(`${size - 1 - row},${col}`);
  if (mirrorH && mirrorV) points.add(`${size - 1 - row},${size - 1 - col}`);
  points.forEach(point => {
    const [r, c] = point.split(',').map(Number);
    if (r !== undefined && c !== undefined && next[r]) next[r][c] = color;
  });
  return next;
}

export function resizeGrid(grid: Grid, size: number): Grid {
  const next = createGrid(size);
  const limit = Math.min(size, grid.length);
  for (let r = 0; r < limit; r++) for (let c = 0; c < limit; c++) next[r]![c] = grid[r]?.[c] ?? null;
  return next;
}

export function colorUsage(grid: Grid): Map<string, number> {
  const usage = new Map<string, number>();
  grid.flat().forEach(color => { if (color) usage.set(color, (usage.get(color) ?? 0) + 1); });
  return usage;
}

export function serializeProject(name: string, grid: Grid): ProjectData {
  return { version: 1, name: name.trim() || 'Untitled pattern', size: grid.length, cells: cloneGrid(grid), updatedAt: new Date().toISOString() };
}

export function parseProject(value: string): ProjectData {
  const data: unknown = JSON.parse(value);
  if (!data || typeof data !== 'object') throw new Error('Invalid project file.');
  const p = data as Partial<ProjectData>;
  if (p.version !== 1 || typeof p.name !== 'string' || typeof p.updatedAt !== 'string' || Number.isNaN(Date.parse(p.updatedAt)) || ![16, 24, 32].includes(p.size ?? 0) || !Array.isArray(p.cells) || p.cells.length !== p.size || p.cells.some(row => !Array.isArray(row) || row.length !== p.size || row.some(cell => cell !== null && (typeof cell !== 'string' || !/^#[0-9a-f]{6}$/i.test(cell))))) {
    throw new Error('This is not a valid Bead Grid Studio project.');
  }
  return { ...p, cells: cloneGrid(p.cells) } as ProjectData;
}
