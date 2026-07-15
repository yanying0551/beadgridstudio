import { describe, expect, it } from 'vitest';
import {
  cloneGrid,
  colorUsage,
  createGrid,
  paintCell,
  parseProject,
  resizeGrid,
  serializeProject,
} from './grid';

describe('grid operations', () => {
  it('creates independent rows and clones without sharing rows', () => {
    const grid = createGrid(16);
    grid[0]![0] = '#112233';
    expect(grid[1]![0]).toBeNull();
    const copy = cloneGrid(grid);
    copy[0]![0] = '#FFFFFF';
    expect(grid[0]![0]).toBe('#112233');
  });

  it('paints without mutating the source', () => {
    const source = createGrid(16);
    const result = paintCell(source, 2, 3, '#ABCDEF');
    expect(source[2]![3]).toBeNull();
    expect(result[2]![3]).toBe('#ABCDEF');
  });

  it('applies horizontal, vertical, and combined mirrors', () => {
    const result = paintCell(createGrid(16), 2, 3, '#123456', true, true);
    expect(result[2]![3]).toBe('#123456');
    expect(result[2]![12]).toBe('#123456');
    expect(result[13]![3]).toBe('#123456');
    expect(result[13]![12]).toBe('#123456');
    expect(colorUsage(result).get('#123456')).toBe(4);
  });

  it('ignores out-of-bounds painting', () => {
    expect(paintCell(createGrid(16), -1, 3, '#123456')).toEqual(createGrid(16));
  });

  it('resizes while preserving the top-left overlap', () => {
    let grid = paintCell(createGrid(16), 15, 15, '#111111');
    grid = paintCell(grid, 1, 1, '#222222');
    const larger = resizeGrid(grid, 24);
    expect(larger).toHaveLength(24);
    expect(larger[15]![15]).toBe('#111111');
    expect(larger[1]![1]).toBe('#222222');
    expect(resizeGrid(larger, 16)[15]![15]).toBe('#111111');
  });

  it('counts each used color', () => {
    let grid = paintCell(createGrid(16), 0, 0, '#AA0000');
    grid = paintCell(grid, 0, 1, '#AA0000');
    grid = paintCell(grid, 0, 2, '#00AA00');
    expect([...colorUsage(grid)]).toEqual([['#AA0000', 2], ['#00AA00', 1]]);
  });
});

describe('project serialization', () => {
  it('serializes, trims the name, and round-trips a project', () => {
    const grid = paintCell(createGrid(16), 4, 5, '#A1B2C3');
    const serialized = serializeProject('  Test pattern  ', grid);
    const parsed = parseProject(JSON.stringify(serialized));
    expect(parsed.version).toBe(1);
    expect(parsed.name).toBe('Test pattern');
    expect(parsed.size).toBe(16);
    expect(parsed.cells).toEqual(grid);
    expect(new Date(parsed.updatedAt).toISOString()).toBe(parsed.updatedAt);
  });

  it('uses a fallback for blank project names', () => {
    expect(serializeProject('   ', createGrid(16)).name).toBe('Untitled pattern');
  });

  it.each([
    '{}',
    JSON.stringify({ version: 1, name: 'bad', size: 12, cells: [], updatedAt: new Date().toISOString() }),
    JSON.stringify({ version: 1, name: 'bad', size: 16, cells: createGrid(16, 'red'), updatedAt: new Date().toISOString() }),
    JSON.stringify({ version: 1, name: 'bad', size: 16, cells: createGrid(16), updatedAt: 'not-a-date' }),
  ])('rejects invalid project data', value => {
    expect(() => parseProject(value)).toThrow();
  });

  it('does not expose parsed cell arrays by reference', () => {
    const source = serializeProject('Safe', createGrid(16));
    const text = JSON.stringify(source);
    const parsed = parseProject(text);
    parsed.cells[0]![0] = '#FFFFFF';
    expect(JSON.parse(text).cells[0][0]).toBeNull();
  });
});
