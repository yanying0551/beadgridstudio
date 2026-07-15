# Bead Grid Studio

A private, browser-based fuse bead pattern and pixel-art editor. No account or server is required; the current project is autosaved in the browser.

## Features

- Paint or erase by clicking and dragging with mouse, pen, or touch
- Horizontal and vertical mirroring
- 16×16, 24×24, and 32×32 boards
- Undo and redo history
- Built-in palette and custom color picker
- Live bead and per-color counts
- Local autosave and portable JSON import/export
- High-resolution transparent or white-background PNG export
- Optional grid lines and keyboard controls

## Development

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Vite prints the local development URL. Production validation:

```bash
npm test
npm run build
```

The production files are written to `dist/`.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `P` | Paint tool |
| `E` | Eraser |
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Shift + Z` or `Ctrl/⌘ + Y` | Redo |
| `G` | Toggle grid lines |
| `?` | Open shortcut help |

## Project files and privacy

Autosave uses the `bead-grid-studio-project-v1` key in `localStorage`. JSON project files contain the project name, board size, cells, format version, and update timestamp. All editing and exports happen locally in the browser.
