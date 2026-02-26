'use client'

import React, { useEffect } from 'react'
import type { ScrollToBlockMessage } from '../shared/messages'
import { MESSAGE_PREFIX } from '../shared/messages'

const ROW_ID_PREFIX = 'layout-row-'

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

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return <>{children}</>
}
