import './style.css';
import {
  cloneGrid,
  colorUsage,
  createGrid,
  paintCell,
  parseProject,
  resizeGrid,
  serializeProject,
  type Grid,
} from './grid';
import {
  createDeferredPersistence,
  createHistory,
  drawPng,
  interpolateCells,
  pushHistory,
  redoHistory,
  safeLoadProject,
  undoHistory,
  type CellPosition,
} from './runtime';

const STORAGE_KEY = 'bead-grid-studio-project-v1';
const SIZES = [16, 24, 32] as const;
const COLORS = [
  ['Black', '#222222'], ['White', '#FFFFFF'], ['Red', '#E53935'], ['Coral', '#FF6B6B'],
  ['Orange', '#F28C28'], ['Yellow', '#FFD43B'], ['Lime', '#94D82D'], ['Green', '#2F9E44'],
  ['Mint', '#38D9A9'], ['Teal', '#0CA678'], ['Cyan', '#22B8CF'], ['Blue', '#3182CE'],
  ['Navy', '#364FC7'], ['Purple', '#7950F2'], ['Lavender', '#B197FC'], ['Pink', '#F06595'],
  ['Brown', '#8D6E63'], ['Tan', '#D4A373'], ['Gray', '#868E96'], ['Light gray', '#CED4DA'],
] as const;

type Tool = 'paint' | 'erase';

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

const gridElement = required<HTMLDivElement>('grid');
const paletteElement = required<HTMLDivElement>('palette');
const projectName = required<HTMLInputElement>('projectName');
const paintButton = required<HTMLButtonElement>('paintBtn');
const eraserButton = required<HTMLButtonElement>('eraserBtn');
const undoButton = required<HTMLButtonElement>('undoBtn');
const redoButton = required<HTMLButtonElement>('redoBtn');
const mirrorH = required<HTMLInputElement>('mirrorH');
const mirrorV = required<HTMLInputElement>('mirrorV');
const gridLines = required<HTMLInputElement>('gridLines');
const customColor = required<HTMLInputElement>('customColor');
const customHex = required<HTMLElement>('customHex');
const selectedName = required<HTMLElement>('selectedName');
const beadCount = required<HTMLElement>('beadCount');
const colorCount = required<HTMLElement>('colorCount');
const usageElement = required<HTMLDivElement>('usage');
const saveStatus = required<HTMLElement>('saveStatus');
const importFile = required<HTMLInputElement>('importFile');
const helpDialog = required<HTMLDialogElement>('helpDialog');
const pngDialog = required<HTMLDialogElement>('pngDialog');

let grid: Grid = createGrid(24);
let tool: Tool = 'paint';
let selectedColor: string = COLORS[0][1];
let selectedColorName: string = COLORS[0][0];
let history = createHistory(grid);
let drawing = false;
let strokeStart: Grid | null = null;
let strokeChanged = false;
let lastPainted = '';
let lastPosition: CellPosition | null = null;

function setStatus(message: string): void {
  saveStatus.textContent = message;
}

function saveProject(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject(projectName.value, grid)));
    setStatus('Saved locally');
  } catch {
    setStatus('Could not save locally');
  }
}

const persistence = createDeferredPersistence(
  saveProject,
  (callback, delay) => window.setTimeout(callback, delay),
  timer => window.clearTimeout(timer),
  250,
);

function saveSoon(): void {
  setStatus('Saving…');
  persistence.schedule();
}

function updateHistoryButtons(): void {
  undoButton.disabled = history.past.length === 0;
  redoButton.disabled = history.future.length === 0;
}

function updateStats(): void {
  const usage = colorUsage(grid);
  let total = 0;
  usage.forEach(count => { total += count; });
  beadCount.textContent = String(total);
  colorCount.textContent = String(usage.size);
  usageElement.replaceChildren();
  if (usage.size === 0) {
    usageElement.textContent = 'Start painting to see totals.';
    return;
  }
  [...usage.entries()].sort((a, b) => b[1] - a[1]).forEach(([color, count]) => {
    const item = document.createElement('span');
    item.className = 'usage-item';
    const dot = document.createElement('i');
    dot.className = 'usage-dot';
    dot.style.backgroundColor = color;
    dot.setAttribute('aria-hidden', 'true');
    item.append(dot, document.createTextNode(String(count)));
    item.title = `${color}: ${count}`;
    usageElement.append(item);
  });
}

function renderGrid(): void {
  const size = grid.length;
  gridElement.style.setProperty('--grid-size', String(size));
  gridElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridElement.setAttribute('aria-label', `${size} by ${size} bead design grid`);
  const fragment = document.createDocumentFragment();
  grid.forEach((row, r) => row.forEach((color, c) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell bead-cell';
    cell.dataset.row = String(r);
    cell.dataset.col = String(c);
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}${color ? `, ${color}` : ', empty'}`);
    if (color) {
      cell.style.backgroundColor = color;
      cell.classList.add('filled');
    }
    fragment.append(cell);
  }));
  gridElement.replaceChildren(fragment);
  document.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.size) === size);
  });
  updateStats();
  updateHistoryButtons();
}

function selectTool(next: Tool): void {
  tool = next;
  const painting = tool === 'paint';
  paintButton.classList.toggle('active', painting);
  eraserButton.classList.toggle('active', !painting);
  paintButton.setAttribute('aria-pressed', String(painting));
  eraserButton.setAttribute('aria-pressed', String(!painting));
}

function selectColor(color: string, name: string): void {
  selectedColor = color.toUpperCase();
  selectedColorName = name;
  selectedName.textContent = name;
  paletteElement.querySelectorAll('.swatch').forEach(button => {
    const swatch = button as HTMLButtonElement;
    const active = swatch.dataset.color === selectedColor;
    swatch.classList.toggle('active', active);
    swatch.setAttribute('aria-pressed', String(active));
  });
  selectTool('paint');
}

function makePalette(): void {
  COLORS.forEach(([name, color]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.dataset.color = color;
    button.style.backgroundColor = color;
    button.title = name;
    button.setAttribute('aria-label', name);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectColor(color, name));
    paletteElement.append(button);
  });
  selectColor(selectedColor, selectedColorName);
}

function applyAt(row: number, col: number): void {
  const key = `${row},${col}`;
  if (lastPainted === key) return;
  lastPainted = key;
  const next = paintCell(grid, row, col, tool === 'erase' ? null : selectedColor, mirrorH.checked, mirrorV.checked);
  if (JSON.stringify(next) === JSON.stringify(grid)) return;
  grid = next;
  strokeChanged = true;
  renderGrid();
}

function cellAtPoint(x: number, y: number): HTMLElement | null {
  const target = document.elementFromPoint(x, y);
  return target instanceof Element ? target.closest<HTMLElement>('.bead-cell') : null;
}

function beginStroke(event: PointerEvent): void {
  if (event.button !== 0 && event.pointerType !== 'touch') return;
  const cell = (event.target as Element).closest<HTMLElement>('.bead-cell');
  if (!cell) return;
  event.preventDefault();
  drawing = true;
  strokeStart = cloneGrid(grid);
  strokeChanged = false;
  lastPainted = '';
  lastPosition = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  gridElement.setPointerCapture(event.pointerId);
  applyAt(Number(cell.dataset.row), Number(cell.dataset.col));
}

function moveStroke(event: PointerEvent): void {
  if (!drawing) return;
  event.preventDefault();
  const cell = cellAtPoint(event.clientX, event.clientY);
  if (cell && gridElement.contains(cell)) {
    const position = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
    const points = lastPosition ? interpolateCells(lastPosition, position) : [position];
    points.forEach(point => applyAt(point.row, point.col));
    lastPosition = position;
  }
}

function endStroke(event: PointerEvent): void {
  if (!drawing) return;
  drawing = false;
  if (gridElement.hasPointerCapture(event.pointerId)) gridElement.releasePointerCapture(event.pointerId);
  if (strokeChanged && strokeStart) {
    history = pushHistory(history, grid);
    updateHistoryButtons();
    saveSoon();
  }
  strokeStart = null;
  lastPainted = '';
  lastPosition = null;
}

function undo(): void {
  const next = undoHistory(history);
  if (next === history) return;
  history = next;
  grid = cloneGrid(history.current);
  renderGrid();
  saveSoon();
}

function redo(): void {
  const next = redoHistory(history);
  if (next === history) return;
  history = next;
  grid = cloneGrid(history.current);
  renderGrid();
  saveSoon();
}

function commitGrid(next: Grid): void {
  history = pushHistory(history, next);
  grid = cloneGrid(history.current);
  renderGrid();
  saveSoon();
}

function download(blob: Blob, extension: string): void {
  const safeName = (projectName.value.trim() || 'bead-pattern').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'bead-pattern';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.${extension}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportPng(): void {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const background = document.querySelector<HTMLInputElement>('input[name="background"]:checked')?.value === 'white' ? 'white' : 'transparent';
  drawPng(context, grid, background);
  canvas.toBlob(blob => {
    if (blob) download(blob, 'png');
    pngDialog.close();
  }, 'image/png');
}

function openDialog(dialog: HTMLDialogElement): void {
  if (!dialog.open) dialog.showModal();
}

makePalette();
const saved = safeLoadProject(() => localStorage, STORAGE_KEY);
if (saved.project) {
  grid = cloneGrid(saved.project.cells);
  history = createHistory(grid);
  projectName.value = saved.project.name;
}
if (saved.error) setStatus(saved.error);
renderGrid();

paintButton.addEventListener('click', () => selectTool('paint'));
eraserButton.addEventListener('click', () => selectTool('erase'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
gridElement.addEventListener('pointerdown', beginStroke);
gridElement.addEventListener('pointermove', moveStroke);
gridElement.addEventListener('pointerup', endStroke);
gridElement.addEventListener('pointercancel', endStroke);
projectName.addEventListener('input', saveSoon);
window.addEventListener('pagehide', persistence.flush);

document.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(button => {
  button.classList.toggle('active', Number(button.dataset.size) === grid.length);
  button.addEventListener('click', () => {
    const size = Number(button.dataset.size);
    if (!SIZES.includes(size as typeof SIZES[number]) || size === grid.length) return;
    commitGrid(resizeGrid(grid, size));
    document.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(item => item.classList.toggle('active', item === button));
  });
});

gridLines.addEventListener('change', () => gridElement.classList.toggle('grid-lines', gridLines.checked));
customColor.addEventListener('input', () => {
  const color = customColor.value.toUpperCase();
  customHex.textContent = color;
  selectColor(color, 'Custom');
});
required<HTMLButtonElement>('clearBtn').addEventListener('click', () => {
  if (colorUsage(grid).size > 0 && !window.confirm('Clear every bead from this board? This can be undone.')) return;
  if (colorUsage(grid).size > 0) commitGrid(createGrid(grid.length));
});
required<HTMLButtonElement>('importBtn').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  importFile.value = '';
  if (!file) return;
  try {
    const project = parseProject(await file.text());
    history = pushHistory(history, project.cells);
    grid = cloneGrid(history.current);
    projectName.value = project.name;
    document.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(button => button.classList.toggle('active', Number(button.dataset.size) === grid.length));
    renderGrid();
    saveSoon();
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'Could not import that project.');
  }
});
required<HTMLButtonElement>('exportJsonBtn').addEventListener('click', () => {
  const json = JSON.stringify(serializeProject(projectName.value, grid), null, 2);
  download(new Blob([json], { type: 'application/json' }), 'json');
});
required<HTMLButtonElement>('exportPngBtn').addEventListener('click', () => openDialog(pngDialog));
required<HTMLButtonElement>('downloadPngBtn').addEventListener('click', exportPng);
required<HTMLButtonElement>('helpBtn').addEventListener('click', () => openDialog(helpDialog));
document.querySelectorAll<HTMLButtonElement>('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
}));

document.addEventListener('keydown', event => {
  const editingText = event.target instanceof HTMLInputElement && ['text', 'color'].includes(event.target.type);
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if (modifier && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  if (editingText || event.altKey || modifier) return;
  if (event.key.toLowerCase() === 'p') selectTool('paint');
  else if (event.key.toLowerCase() === 'e') selectTool('erase');
  else if (event.key.toLowerCase() === 'g') {
    gridLines.checked = !gridLines.checked;
    gridElement.classList.toggle('grid-lines', gridLines.checked);
  } else if (event.key === '?') openDialog(helpDialog);
});
