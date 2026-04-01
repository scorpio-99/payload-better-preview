export const MESSAGE_PREFIX = 'better-preview:'

export type ScrollToBlockMessage = {
  type: `${typeof MESSAGE_PREFIX}scroll-to-block`
  field: string
  index: number
}

export function isScrollToBlockMessage(data: unknown): data is ScrollToBlockMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as ScrollToBlockMessage).type === `${MESSAGE_PREFIX}scroll-to-block` &&
    'field' in data &&
    typeof (data as ScrollToBlockMessage).field === 'string' &&
    'index' in data &&
    typeof (data as ScrollToBlockMessage).index === 'number'
  )
}

export type FocusBlockMessage = {
  type: `${typeof MESSAGE_PREFIX}focus-block`
  field: string
  index: number
  richTextBlockId?: string
}

export function isFocusBlockMessage(data: unknown): data is FocusBlockMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as FocusBlockMessage).type === `${MESSAGE_PREFIX}focus-block` &&
    'field' in data &&
    typeof (data as FocusBlockMessage).field === 'string' &&
    'index' in data &&
    typeof (data as FocusBlockMessage).index === 'number'
  )
}

export type ScrollToRichTextBlockMessage = {
  type: `${typeof MESSAGE_PREFIX}scroll-to-richtext-block`
  blockId: string
}

export function isScrollToRichTextBlockMessage(data: unknown): data is ScrollToRichTextBlockMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as ScrollToRichTextBlockMessage).type === `${MESSAGE_PREFIX}scroll-to-richtext-block` &&
    'blockId' in data &&
    typeof (data as ScrollToRichTextBlockMessage).blockId === 'string'
  )
}

export type ScrollToRichTextNestedBlockMessage = {
  type: `${typeof MESSAGE_PREFIX}scroll-to-richtext-nested-block`
  richTextBlockId: string
  index: number
}

export function isScrollToRichTextNestedBlockMessage(
  data: unknown,
): data is ScrollToRichTextNestedBlockMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as ScrollToRichTextNestedBlockMessage).type ===
      `${MESSAGE_PREFIX}scroll-to-richtext-nested-block` &&
    'richTextBlockId' in data &&
    typeof (data as ScrollToRichTextNestedBlockMessage).richTextBlockId === 'string' &&
    'index' in data &&
    typeof (data as ScrollToRichTextNestedBlockMessage).index === 'number'
  )
}

export type FocusRichTextBlockMessage = {
  type: `${typeof MESSAGE_PREFIX}focus-richtext-block`
  blockId: string
}

export function isFocusRichTextBlockMessage(data: unknown): data is FocusRichTextBlockMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as FocusRichTextBlockMessage).type === `${MESSAGE_PREFIX}focus-richtext-block` &&
    'blockId' in data &&
    typeof (data as FocusRichTextBlockMessage).blockId === 'string'
  )
}
