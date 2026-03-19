# payload-better-preview

Better live preview for [Payload CMS](https://payloadcms.com) — hover highlighting with block identification, bi-directional admin/preview sync, and smooth transitions.

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

- **Admin → Preview**: clicking anywhere inside a block row in the admin sends a `scroll-to-block` message to the preview iframe. The preview scrolls to the matching `[data-block-field][data-block-index]` element and shows a highlight overlay.
- **Preview → Admin**: clicking a block in the preview sends a `focus-block` message to the admin. The admin expands all ancestor rows (for nested blocks), then scrolls to and highlights the target block row.
- All communication is via `window.postMessage`. No network requests, no shared state.

`<BetterPreview />` is a `'use client'` component that renders `null` (no React DOM output). It injects 3 absolutely-positioned DOM elements into `document.body`:

1. **Overlay** — Primary block highlight (solid blue border)
2. **Parent Overlay** — For nested blocks (dashed border, subtle)
3. **Label** — Info badge with block type and index

All interaction is handled via event delegation on `document`, so it survives DOM updates from live preview re-renders.
