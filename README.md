# payload-better-preview

[![npm](https://img.shields.io/npm/v/payload-better-preview?logo=npm&color=ce421b)](https://www.npmjs.com/package/payload-better-preview)
[![downloads](https://img.shields.io/npm/dt/payload-better-preview?logo=npm&color=ce421b)](https://www.npmjs.com/package/payload-better-preview)
[![issues](https://img.shields.io/github/issues/scorpio-99/payload-better-preview?logo=github&color=blue)](https://github.com/scorpio-99/payload-better-preview/issues)
[![stars](https://img.shields.io/github/stars/scorpio-99/payload-better-preview?logo=github)](https://github.com/scorpio-99/payload-better-preview)

Better live preview for [Payload CMS](https://payloadcms.com) — hover highlighting with block identification, bi-directional admin/preview sync, and smooth transitions.

> **Found a bug?** Please [open an issue](https://github.com/scorpio-99/payload-better-preview/issues/new) with steps to reproduce, your Payload version, and a minimal example. PRs welcome too.

## Features

### Hover Highlighting

Blue overlay marks the block under the cursor with a label badge showing block type, index, and name. Nested blocks get a dashed parent overlay with breadcrumb labels.

![Hover Highlighting](./assets/hover-highlighting.gif)

### Admin → Preview Sync

Click a block row in the admin editor — the preview scrolls to that block and highlights it with a flash effect.

![Admin to Preview Sync](./assets/admin-to-preview.gif)

### Preview → Admin Sync

Click a block in the preview — the admin editor scrolls to the corresponding block row, expands it if collapsed (including all ancestor rows for nested blocks), and highlights it.

![Preview to Admin Sync](./assets/preview-to-admin.gif)

### Other

- **Draft-only** — Zero impact on published pages
- **Scroll/Resize tracking** — Overlay follows block position smoothly
- **Infinite nesting** — Bi-directional sync works at any block nesting depth

## Installation

```bash
pnpm add payload-better-preview
# or
npm install payload-better-preview
```

### 1. Register the plugin

```ts
// payload.config.ts
import { betterPreview } from 'payload-better-preview'

export default buildConfig({
  plugins: [
    betterPreview({
      accentColor: '#3b82f6', // optional
      scrollAlign: 'start',   // optional
      scrollOffset: 128,      // optional
    }),
  ],
  admin: {
    livePreview: {
      collections: ['pages'],
      url({ data }) {
        return `/${data.id}`
      },
    },
  },
})
```

### 2. Add data attributes to block wrappers

Each rendered block must have three data attributes:

| Attribute | Description |
|---|---|
| `data-block` | Block type slug, e.g. `"hero"`, `"text"` |
| `data-block-index` | 0-based index within the blocks field |
| `data-block-field` | Field path — see below |
| `data-block-name` | Optional display name shown in the overlay label |

The `data-block-field` value must match the Payload field name so the plugin can map blocks between the admin and the preview:

```tsx
export function BlockRenderer({ block, index, field }) {
  return (
    <div
      data-block={block.blockType}
      data-block-index={index}
      data-block-field={field}
      data-block-name={block.name} // optional
    >
      {/* block content */}
    </div>
  )
}

export function RenderBlocks({ blocks, field }) {
  return blocks.map((block, index) => (
    <BlockRenderer key={block.id} block={block} index={index} field={field} />
  ))
}
```

```tsx
// pass the exact Payload field name
<RenderBlocks blocks={page.content} field="content" />
<RenderBlocks blocks={page.sidebar} field="sidebar" />
```

### 3. Render `<BetterPreview />` in your page

```tsx
import { BetterPreview } from 'payload-better-preview/client'

export default async function Page() {
  const { isEnabled: draft } = await draftMode()

  return (
    <>
      {draft && <LivePreviewListener />}
      {draft && <BetterPreview />}
      {/* ... rest of page */}
    </>
  )
}
```


## Nested blocks

For blocks that contain other blocks, construct the `field` prop by concatenating the parent field, parent index, and child field name with hyphens. This matches the ID pattern Payload generates in the admin and enables sync at any depth:

```tsx
export function NestedBlockRenderer({ block, index, field }) {
  return (
    <div
      data-block={block.blockType}
      data-block-index={index}
      data-block-field={field}
    >
      <RenderBlocks
        blocks={block.content}
        field={`${field}-${index}-content`}
        {/* e.g. "content-0-content", "content-0-content-1-sidebar" */}
      />
    </div>
  )
}
```

## RichText (Lexical) blocks

Payload's Lexical editor supports blocks embedded directly inside richText fields. The plugin provides full bi-directional sync for these blocks too.

> **Requires Payload 3.81+.** On older versions the Lexical plugin component is rendered outside of the `LexicalComposerContext` during SSR and throws. The core block sync (layout blocks, hover highlighting, Admin ↔ Preview sync) still works on Payload ^3.0.0 — only the richText-block sync is gated on 3.81+.

### 1. Register the Lexical feature

Add `BetterPreviewLexicalFeature` to your Lexical editor config. This injects a client-side plugin that stamps each block in the editor with a `data-block-id` attribute so the admin can locate them:

```ts
// payload.config.ts
import { betterPreview, BetterPreviewLexicalFeature } from 'payload-better-preview'
import { lexicalEditor, BlocksFeature } from '@payloadcms/richtext-lexical'

export default buildConfig({
  plugins: [betterPreview()],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({ blocks: [...] }),
      BetterPreviewLexicalFeature(),
    ],
  }),
})
```

### 2. Add data attributes in JSX converters

Add `data-block-id` (the block's unique ID from `node.fields.id`) to each block wrapper. The plugin uses this ID to sync between admin and preview:

```tsx
// jsxConverters.tsx
import { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

export const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    hero: ({ node }) => (
      <div
        data-block={node.fields.blockType}
        data-block-id={node.fields.id}         // required for richText sync
      >
        {/* block content */}
      </div>
    ),
  },
})
```

### How it works

- **`data-block-id`** identifies each block uniquely across both admin and preview
- **Admin → Preview**: clicking a Lexical block in the admin sends `scroll-to-richtext-block` with the block ID — the preview finds `[data-block-id]` and scrolls to it
- **Preview → Admin**: clicking a block with `data-block-id` (but no `data-block-field`) sends `focus-richtext-block` — the admin finds `[data-block-id]`, expands the collapsible if needed, and scrolls to it

### Disabling sync on specific elements

Add `data-preview-ignore` to any element to prevent clicks on it from triggering scroll sync. Works in both directions — in the preview (blocks rendered on the frontend) and in the admin (custom block components inside the Lexical editor).

Useful for interactive elements like buttons, links, or custom controls inside a block component:

```tsx
// jsxConverters.tsx — preview side
blocks: {
  cta: ({ node }) => (
    <div
      data-block={node.fields.blockType}
      data-block-id={node.fields.id}
    >
      <h2>{node.fields.title}</h2>
      {/* clicks here will NOT trigger scroll sync */}
      <button data-preview-ignore onClick={...}>
        Buy now
      </button>
    </div>
  ),
},
```

```tsx
// Custom block component — admin side (Lexical editor)
export function CtaBlockComponent({ formData }) {
  return (
    <div>
      <p>{formData.title}</p>
      {/* clicks here will NOT send scroll-to-preview message */}
      <button data-preview-ignore onClick={openModal}>
        Edit link
      </button>
    </div>
  )
}
```

Any click originating inside a `[data-preview-ignore]` element is ignored by the plugin entirely — hover highlighting and scroll sync are both skipped for that interaction.

### Nested blocks inside richText

For blocks that are nested inside a richText block (e.g. a `nestedBlock` with its own `blocks` field), sync works the same as regular nested blocks. The plugin automatically detects the parent richText block and scopes the search to avoid duplicate IDs.

Add `data-block-field` and `data-block-index` to nested blocks (but NOT to direct richText blocks since they have no field path):

```tsx
// For the outer richText block (nestedBlock):
<div
  data-block={node.fields.blockType}
  data-block-id={node.fields.id}
>
  <RenderBlocks
    blocks={node.fields.content}
    field="content"               // local field name only (not full path)
    richTextBlockId={node.fields.id}
  />
</div>

// For inner blocks (BlockRenderer receives richTextBlockId from parent):
<div
  data-block={block.blockType}
  data-block-id={block.id}
  data-block-index={index}
  data-block-field={field}        // e.g. "content"
>
```

## Plugin options

| Option | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Disable the plugin entirely |
| `accentColor` | `string` | `'#3b82f6'` | Highlight color for overlays and flash effects in the admin |
| `scrollAlign` | `'start' \| 'center' \| 'end'` | `'start'` | Block alignment when scrolling in admin |
| `scrollOffset` | `number` | `128` | Top offset in px when scrolling in admin — accounts for the sticky admin header |

## `<BetterPreview />` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `accentColor` | `string` | `'#3b82f6'` | Highlight color for overlays and flash effects in the preview |
| `scrollAlign` | `'start' \| 'center' \| 'end'` | `'start'` | Block alignment when scrolling in the preview |
| `scrollOffset` | `number` | `0` | Top offset in px when scrolling in the preview — useful for fixed headers |
| `showToggle` | `boolean` | `true` | Show the built-in toggle button |
| `toggleComponent` | `React.ComponentType<ToggleProps>` | — | Replace the built-in toggle with a custom component |

### Scroll offset in the preview

The preview uses `window.scrollTo` internally to avoid propagating scroll to the parent admin frame. Because of this, `scroll-margin-top` has no effect. Use `scrollOffset` instead:

```tsx
<BetterPreview scrollOffset={80} />
```

### Custom toggle component

```tsx
import type { ToggleProps } from 'payload-better-preview/client'

function MyToggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button onClick={onToggle} style={{ position: 'fixed', top: 16, right: 16 }}>
      {enabled ? 'Sync on' : 'Sync off'}
    </button>
  )
}

<BetterPreview toggleComponent={MyToggle} />
```

## How it works

**Block fields (standard):**
- **Admin → Preview**: clicking a block row in the admin sends `scroll-to-block` with `{ field, index }` to the preview iframe. The preview finds `[data-block-field][data-block-index]` and scrolls to it.
- **Preview → Admin**: clicking a block with `data-block-field` sends `focus-block`. The admin expands all ancestor rows and scrolls to the target row.

**RichText (Lexical) blocks:**
- **Admin → Preview**: clicking a Lexical block sends `scroll-to-richtext-block` with `{ blockId }`. The preview finds `[data-block-id]` and scrolls to it.
- **Preview → Admin**: clicking a block with `data-block-id` (but no `data-block-field`) sends `focus-richtext-block`. The admin finds `[data-block-id]`, expands the collapsible if needed, and scrolls to it.
- **Nested blocks inside richText**: clicking sends `focus-block` with an extra `richTextBlockId`. The admin opens the parent Lexical block, then scopes the row search within it — avoiding duplicate ID issues when multiple identical blocks exist.

All communication is via `window.postMessage`. No network requests, no shared state.

`<BetterPreview />` is a `'use client'` component that renders `null` (no React DOM output). It injects 3 absolutely-positioned DOM elements into `document.body`:

1. **Overlay** — Primary block highlight (solid blue border)
2. **Parent Overlay** — For nested blocks (dashed border, subtle)
3. **Label** — Info badge with block type and index

All interaction is handled via event delegation on `document`, so it survives DOM updates from live preview re-renders.

## Contributors
<a href="https://github.com/scorpio-99/payload-better-preview/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=scorpio-99/payload-better-preview" />
</a>
