'use client'

import React, { useEffect } from 'react'
import { DEFAULT_ACCENT_COLOR, ATTR_IGNORE, FLASH_DURATION, makeColors } from './constants'
import type { ScrollToBlockMessage, ScrollToRichTextBlockMessage, ScrollToRichTextNestedBlockMessage } from './messages'
import { MESSAGE_PREFIX, isFocusBlockMessage, isFocusRichTextBlockMessage } from './messages'

function getPreviewIframe(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>(
    'iframe#live-preview-iframe, iframe.live-preview-iframe, iframe[src*="/preview"], iframe[title*="preview"]',
  )
}

function extractBlockLocation(el: Element): { field: string; index: number } | null {
  const row = el.closest('[id*="-row-"]')
  if (!row) return null
  const match = row.id.match(/^(.+)-row-(\d+)$/)
  if (!match) return null
  return { field: match[1], index: Number(match[2]) }
}

function findBlockRow(field: string, index: number): Element | null {
  return document.querySelector(`[id="${field}-row-${index}"]`)
}

function extractRichTextBlockId(el: Element): string | null {
  const block = el.closest('[data-block-id]')
  return block?.getAttribute('data-block-id') ?? null
}

function expandIfCollapsed(row: Element): void {
  const collapsible = row.querySelector('.collapsible--collapsed')
  if (!collapsible) return
  const toggle = collapsible.querySelector<HTMLButtonElement>('.collapsible__toggle')
  toggle?.click()
}

function scrollToElement(el: Element, align: ScrollLogicalPosition, offset: number) {
  const htmlEl = el as HTMLElement
  const prev = htmlEl.style.scrollMarginTop
  htmlEl.style.scrollMarginTop = `${offset}px`
  el.scrollIntoView({ behavior: 'smooth', block: align })
  setTimeout(() => {
    htmlEl.style.scrollMarginTop = prev
  }, 1000)
}

// Parses field path to get ancestor row IDs from outermost to innermost.
// e.g. "content-0-content-1-sidebar" → ["content-row-0", "content-0-content-row-1"]
function getAncestorRowIds(field: string): string[] {
  const ancestors: string[] = []
  const regex = /-(\d+)-/g
  let match
  while ((match = regex.exec(field)) !== null) {
    const prefix = field.slice(0, match.index)
    ancestors.push(`${prefix}-row-${match[1]}`)
  }
  return ancestors
}

function flashHighlightRow(row: Element, colors: ReturnType<typeof makeColors>): void {
  const el = row as HTMLElement
  const prev = {
    transition: el.style.transition,
    boxShadow: el.style.boxShadow,
    backgroundColor: el.style.backgroundColor,
    borderRadius: el.style.borderRadius,
  }

  Object.assign(el.style, {
    transition: `box-shadow ${FLASH_DURATION / 2}ms ease, background-color ${FLASH_DURATION / 2}ms ease`,
    boxShadow: `0 0 0 2px ${colors.border}`,
    backgroundColor: colors.bg,
    borderRadius: '4px',
  })

  setTimeout(() => {
    Object.assign(el.style, {
      boxShadow: 'none',
      backgroundColor: 'transparent',
    })
  }, FLASH_DURATION / 2)

  setTimeout(() => {
    Object.assign(el.style, prev)
  }, FLASH_DURATION)
}

type Props = {
  children: React.ReactNode
  accentColor?: string
  scrollAlign?: 'start' | 'center' | 'end'
  scrollOffset?: number
}

export const AdminBlockSyncProvider: React.FC<Props> = ({ children, accentColor, scrollAlign = 'start', scrollOffset = 128 }) => {
  useEffect(() => {
    const colors = makeColors(accentColor ?? DEFAULT_ACCENT_COLOR)
    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return

      if ((target as Element).closest('.collapsible__toggle')) return
      if ((target as Element).closest(`[${ATTR_IGNORE}]`)) return

      const iframe = getPreviewIframe()
      if (!iframe?.contentWindow) return

      const location = extractBlockLocation(target)
      if (location) {
        // If the row is inside a Lexical richText block, scope by parent block ID
        const lexicalParent = target.closest('[data-block-id]')
        if (lexicalParent) {
          const richTextBlockId = lexicalParent.getAttribute('data-block-id')
          if (richTextBlockId) {
            const message: ScrollToRichTextNestedBlockMessage = {
              type: `${MESSAGE_PREFIX}scroll-to-richtext-nested-block`,
              richTextBlockId,
              index: location.index,
            }
            iframe.contentWindow.postMessage(message, '*')
            return
          }
        }

        const message: ScrollToBlockMessage = {
          type: `${MESSAGE_PREFIX}scroll-to-block`,
          field: location.field,
          index: location.index,
        }
        iframe.contentWindow.postMessage(message, '*')
        return
      }

      const blockId = extractRichTextBlockId(target)
      if (blockId) {
        const message: ScrollToRichTextBlockMessage = {
          type: `${MESSAGE_PREFIX}scroll-to-richtext-block`,
          blockId,
        }
        iframe.contentWindow.postMessage(message, '*')
      }
    }

    function handleMessage(e: MessageEvent) {
      if (isFocusRichTextBlockMessage(e.data)) {
        const iframe = getPreviewIframe()
        if (!iframe?.contentWindow || e.source !== iframe.contentWindow) return

        const el = document.querySelector(`[data-block-id="${e.data.blockId}"]`)
        if (!el) return

        const wasCollapsed = !!el.querySelector('.collapsible--collapsed')
        expandIfCollapsed(el)

        setTimeout(() => {
          scrollToElement(el, scrollAlign, scrollOffset)
          flashHighlightRow(el, colors)
        }, wasCollapsed ? 350 : 0)
        return
      }

      if (!isFocusBlockMessage(e.data)) return

      const iframe = getPreviewIframe()
      if (!iframe?.contentWindow || e.source !== iframe.contentWindow) return

      const { field, index, richTextBlockId } = e.data

      // Nested block inside a richText Lexical block
      if (richTextBlockId) {
        const parent = document.querySelector(`[data-block-id="${richTextBlockId}"]`)
        if (!parent) return

        const wasParentCollapsed = !!parent.querySelector('.collapsible--collapsed')
        expandIfCollapsed(parent)

        setTimeout(() => {
          // Use local field name (last segment) to scope within the parent form
          const localField = field.split('-').pop() ?? field
          const row = parent.querySelector(`[id="${localField}-row-${index}"]`)
          if (!row) return

          const wasRowCollapsed = !!row.querySelector('.collapsible--collapsed')
          expandIfCollapsed(row)

          setTimeout(() => {
            scrollToElement(row, scrollAlign, scrollOffset)
            flashHighlightRow(row, colors)
          }, wasRowCollapsed ? 350 : 0)
        }, wasParentCollapsed ? 350 : 0)
        return
      }

      const ancestorIds = getAncestorRowIds(field)

      ancestorIds.forEach((id) => {
        const ancestor = document.querySelector(`[id="${id}"]`)
        if (ancestor) expandIfCollapsed(ancestor)
      })

      const ancestorDelay = ancestorIds.length > 0 ? 350 : 0
      setTimeout(() => {
        const row = findBlockRow(field, index)
        if (!row) return

        const wasCollapsed = !!row.querySelector('.collapsible--collapsed')
        expandIfCollapsed(row)

        setTimeout(() => {
          scrollToElement(row, scrollAlign, scrollOffset)
          flashHighlightRow(row, colors)
        }, wasCollapsed ? 350 : 0)
      }, ancestorDelay)
    }

    document.addEventListener('click', handleClick)
    window.addEventListener('message', handleMessage)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('message', handleMessage)
    }
  }, [accentColor, scrollAlign, scrollOffset])

  return <>{children}</>
}
