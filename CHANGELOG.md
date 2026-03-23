# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

## [2.0.0] 2026-03-23
### Added
- Nested block support — bi-directional sync works at any block nesting depth, ancestor rows are automatically expanded
- Customizable accent color via `accentColor` option (plugin config and `<BetterPreview />` prop)
- Scroll alignment via `scrollAlign` option (`'start'` | `'center'` | `'end'`)
- Scroll offset via `scrollOffset` option (px) — accounts for fixed headers or admin toolbar
- Toggle button in the preview iframe to enable/disable block sync
- `showToggle` prop to hide the built-in toggle button
- `toggleComponent` prop for rendering a custom toggle UI
- `ToggleProps` type export from `payload-better-preview/client`
- Origin validation on postMessage — messages are only accepted from the preview iframe
### Changed
- **BREAKING**: Block wrapper elements now require a `data-block-field` attribute containing the Payload field path (e.g. `"layout"`)
- **BREAKING**: Message protocol now includes a mandatory `field` property in `scroll-to-block` and `focus-block` messages
- Replaced hardcoded `ROW_ID_PREFIX` with generic regex-based row ID parsing — supports arbitrary field names
- Colors are now generated dynamically via `makeColors()` using `color-mix()` instead of static RGBA values
- Plugin options are passed as `clientProps` to `AdminBlockSyncProvider` instead of using a plain string provider path
### Fixed
- Clicking the collapse toggle in the admin no longer triggers a scroll-to-block message

## [1.0.1] 2026-02-27
### Fixed
- Fixed `exports` in package.json pointing to `src/` instead of `dist/`, causing "Module not found" errors when installed from npm

## [1.0.0] 2026-02-27
### Changed
- **BREAKING**: Renamed `PreviewToolbar` to `BetterPreview` — update imports to `import { BetterPreview } from 'payload-better-preview/client'`
### Fixed
- Added `.d.ts` type declarations to published package

## [0.3.2] 2026-02-27
### Changed
- Prepared npm publish

## [0.3.1] 2026-02-26
### Changed
- Flattened `src/` structure: removed `components/`, `exports/`, `shared/` subdirectories
- Extracted shared constants (`COLORS`, `FLASH_DURATION`, attribute names) into `constants.ts`
- Extracted DOM helper functions (`createOverlay`, `createLabel`, `positionOverlay`, etc.) into `overlay.ts`
- Replaced hardcoded color values in `AdminBlockSyncProvider` with shared `COLORS` constants
- Removed unused refs (`overlayRef`, `parentOverlayRef`, `labelRef`) from `PreviewToolbar`

## [0.3.0] 2026-02-26
### Added
- Preview → Admin sync: clicking a block in the preview scrolls the admin editor to the corresponding block row
- Auto-expand collapsed blocks when focused from preview
- Flash highlight on the admin block row (blue box-shadow, 1.5s fade-out)
- `cursor: pointer` on hoverable blocks in preview
- `FocusBlockMessage` type and `isFocusBlockMessage()` type guard in shared message protocol

## [0.2.0] 2026-02-26
### Added
- Admin → Preview sync: clicking a block row in the admin editor scrolls the preview to that block
- Flash highlight effect on synced block (blue overlay, 1.5s fade-out)
- `AdminBlockSyncProvider` component, auto-injected into admin UI
- Shared message protocol (`better-preview:scroll-to-block`) via postMessage

## [0.1.0] 2026-02-26
### Added
- Hover highlighting with blue overlay on blocks
- Block label badge showing `#N BlockType` (e.g. `#3 Headline`)
- Named block support, label includes block name: `#3 Headline "My Title"`
- Nested block detection with parent dashed overlay and breadcrumb label (`#2 Columns › #1 Text`)
- Scroll and resize tracking, overlay follows block position smoothly
- Draft-only rendering, zero impact on published pages
- Plugin config with `disabled` option
- `<PreviewToolbar />` client component with event-delegation-based interaction
