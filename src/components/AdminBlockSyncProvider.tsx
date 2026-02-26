'use client'

import React, { useEffect } from 'react'
import type { ScrollToBlockMessage } from '../shared/messages'
import { MESSAGE_PREFIX, isFocusBlockMessage } from '../shared/messages'

const ROW_ID_PREFIX = 'layout-row-'
const FLASH_DURATION = 1500

function getPreviewIframe(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>(
    'iframe.live-preview-iframe, iframe[src*="/preview"], iframe[title*="preview"]',
  )
}

function extractBlockIndex(el: Element): number | null {
  const row = el.closest(`[id^="${ROW_ID_PREFIX}"]`)
  if (!row) return null
  const index = Number(row.id.slice(ROW_ID_PREFIX.length))
  return Number.isNaN(index) ? null : index
}

function findBlockRow(index: number): Element | null {
  return document.querySelector(`[id$="-row-${index}"]`)
}

function expandIfCollapsed(row: Element): void {
  const collapsible = row.querySelector('.collapsible--collapsed')
  if (!collapsible) return
  const toggle = collapsible.querySelector<HTMLButtonElement>('.collapsible__toggle')
  toggle?.click()
}

function flashHighlightRow(row: Element): void {
  const el = row as HTMLElement
  const prev = {
    transition: el.style.transition,
    boxShadow: el.style.boxShadow,
    backgroundColor: el.style.backgroundColor,
    borderRadius: el.style.borderRadius,
  }

  Object.assign(el.style, {
    transition: `box-shadow ${FLASH_DURATION / 2}ms ease, background-color ${FLASH_DURATION / 2}ms ease`,
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.8)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
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

export const AdminBlockSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return

      const index = extractBlockIndex(target)
      if (index === null) return

      const iframe = getPreviewIframe()
      if (!iframe?.contentWindow) return

      const message: ScrollToBlockMessage = {
        type: `${MESSAGE_PREFIX}scroll-to-block`,
        index,
      }

      iframe.contentWindow.postMessage(message, '*')
    }

    function handleMessage(e: MessageEvent) {
      if (!isFocusBlockMessage(e.data)) return

      const row = findBlockRow(e.data.index)
      if (!row) return

      expandIfCollapsed(row)
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      flashHighlightRow(row)
    }

    document.addEventListener('click', handleClick)
    window.addEventListener('message', handleMessage)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return <>{children}</>
}
