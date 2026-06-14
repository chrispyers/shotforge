# Shotforge — Project notes

## What this is

A web app for generating App Store / Google Play store screenshots. Tool-for-self that helps Chris ship the rest of the portfolio faster — not a product to monetize. The screenshot-generator market is saturated; the value here is building exactly the aesthetic Chris wants (Material You vibes, Google Sans Flex, custom gradients) without paying $30/mo for a tool that doesn't quite fit.

## Tech stack

- Vite + React + TypeScript
- Tailwind v3
- Zustand with `persist` middleware (localStorage) for project state
- @dnd-kit/sortable for drag-to-reorder pages
- html-to-image for rasterizing the page DOM at full resolution
- JSZip + file-saver for the .zip download
- nanoid for IDs

## How rendering works

Single component — `PageRenderer` — renders a page at any pixel size. Used both for:
- Live preview (passed `displayWidth={N}` to scale down)
- Export (passed `fullResolution` to render at the preset's true pixel dimensions in a hidden offscreen container, then snapshotted via html-to-image)

This means preview ≈ export. If you change the renderer, both update together.

## Fonts

Loads Google Sans Flex (with `ROND` axis) and Roboto Flex from Google Fonts as fallback. Variable axes are applied via `fontVariationSettings`. If Google Sans Flex ever stops being served, fallback chain is Roboto Flex → Inter.

## State shape

- `Project`: has `theme` (defaults applied to new pages) and a `pages[]` array
- `Page`: resolution + colors + spotlight + headline + subhead + device config
- "Apply theme to all pages" pushes the project's theme onto every existing page (one-shot, not live binding — by design, so per-page tweaks survive theme edits)

## Priorities

- **Google Play first** — Chris is launching imminently. iOS is later.
- The simple charcoal phone frame is intentional for v1. No notch / Dynamic Island / camera punchout.
- Build features behind toggles when uncertain (drop shadow, status bar, tilt are all optional).

## Things deferred

- Multi-resolution export from a single source (generate all device classes from one design). High-leverage v1.5 feature.
- Real iOS device frames with Dynamic Island.
- Mesh / image / pattern backgrounds beyond the spotlight gradient.
- Eventually package as Electron app for offline use.

## File map

- `src/App.tsx` — three-panel layout
- `src/components/Sidebar.tsx` — page list, project switcher, export buttons
- `src/components/CanvasArea.tsx` — center preview, auto-scales to fit
- `src/components/ControlPanel.tsx` — right panel, all controls
- `src/components/PageRenderer.tsx` — the render component (preview + export)
- `src/components/DeviceFrame.tsx` — generic charcoal phone frame
- `src/lib/store.ts` — zustand store with persistence
- `src/lib/presets.ts` — resolution presets and spotlight position lookups
- `src/lib/export.ts` — full-resolution PNG render → ZIP / JSON I/O
- `src/types.ts` — Page / Project / TextLayer / etc.
