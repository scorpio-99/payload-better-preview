# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com),
and this project adheres to [Semantic Versioning](https://semver.org).

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
