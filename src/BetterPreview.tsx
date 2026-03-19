'use client'

import { useEffect, useRef, useState } from 'react'
import { ATTR, ATTR_INDEX, ATTR_FIELD, DEFAULT_ACCENT_COLOR, makeColors } from './constants'
import { isScrollToBlockMessage, MESSAGE_PREFIX } from './messages'
import type { FocusBlockMessage } from './messages'
import {
  createOverlay,
  createLabel,
  positionOverlay,
  positionLabel,
  hideEl,
  buildLabel,
  flashHighlight,
} from './overlay'


export type ToggleProps = {
  enabled: boolean
  onToggle: () => void
}

type Props = {
  accentColor?: string
  showToggle?: boolean
  scrollAlign?: 'start' | 'center' | 'end'
  scrollOffset?: number
  toggleComponent?: React.ComponentType<ToggleProps>
}

export const BetterPreview: React.FC<Props> = ({ accentColor, showToggle = true, scrollAlign = 'start', scrollOffset = 0, toggleComponent: ToggleComponent }) => {
  const [isInsideIframe, setIsInsideIframe] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const currentBlockRef = useRef<Element | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    setIsInsideIframe(window.self !== window.top)
  }, [])

  useEffect(() => {
    if (!isInsideIframe || !enabled) return

    const colors = makeColors(accentColor ?? DEFAULT_ACCENT_COLOR)

    const overlay = createOverlay(false, colors)
    const parentOverlay = createOverlay(true, colors)
    const label = createLabel(colors)

    const style = document.createElement('style')
    style.textContent = `[${ATTR}] { cursor: pointer; }`
    document.head.appendChild(style)

    document.body.appendChild(overlay)
    document.body.appendChild(parentOverlay)
    document.body.appendChild(label)

    function hideAll() {
      hideEl(overlay)
      hideEl(parentOverlay)
      hideEl(label)
      currentBlockRef.current = null
    }

    function updatePosition() {
      const block = currentBlockRef.current
      if (!block) return

      const rect = block.getBoundingClientRect()
      positionOverlay(overlay, rect)
      positionLabel(label, rect)

      const parent = block.parentElement?.closest(`[${ATTR}]`)
      if (parent) {
        positionOverlay(parentOverlay, parent.getBoundingClientRect())
      }
    }

    function handleMouseOver(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return

      const block = target.closest(`[${ATTR}]`)
      if (!block) {
        hideAll()
        return
      }

      if (block === currentBlockRef.current) return

      currentBlockRef.current = block
      const rect = block.getBoundingClientRect()
      const parent = block.parentElement?.closest(`[${ATTR}]`)

      positionOverlay(overlay, rect)
      label.textContent = buildLabel(block, parent)
      positionLabel(label, rect)

      if (parent) {
        positionOverlay(parentOverlay, parent.getBoundingClientRect())
      } else {
        hideEl(parentOverlay)
      }
    }

    function handleMouseOut(e: MouseEvent) {
      const related = e.relatedTarget as Element | null
      if (!related || !related.closest?.(`[${ATTR}]`)) {
        hideAll()
      }
    }

    function handleScrollResize() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updatePosition)
    }

    function handleMessage(e: MessageEvent) {
      if (!isScrollToBlockMessage(e.data)) return

      const block = document.querySelector(
        `[${ATTR_FIELD}="${e.data.field}"][${ATTR_INDEX}="${e.data.index}"]`,
      )
      if (!block) return

      currentBlockRef.current = block
      const rect = block.getBoundingClientRect()
      const parent = block.parentElement?.closest(`[${ATTR}]`)

      positionOverlay(overlay, rect)
      label.textContent = buildLabel(block, parent)
      positionLabel(label, rect)

      if (parent) {
        positionOverlay(parentOverlay, parent.getBoundingClientRect())
      } else {
        hideEl(parentOverlay)
      }

      let top: number
      if (scrollAlign === 'center') {
        top = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2 - scrollOffset
      } else if (scrollAlign === 'end') {
        top = rect.top + window.scrollY - window.innerHeight + rect.height - scrollOffset
      } else {
        top = rect.top + window.scrollY - scrollOffset
      }
      window.scrollTo({ top, behavior: 'smooth' })
      setTimeout(() => flashHighlight(block, colors), 400)
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return

      const block = target.closest(`[${ATTR}]`)
      if (!block) return

      const indexStr = block.getAttribute(ATTR_INDEX)
      if (indexStr == null) return

      const index = Number(indexStr)
      if (Number.isNaN(index)) return

      const field = block.getAttribute(ATTR_FIELD)
      if (!field) return

      const message: FocusBlockMessage = {
        type: `${MESSAGE_PREFIX}focus-block`,
        field,
        index,
      }
      window.parent.postMessage(message, '*')
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScrollResize, { passive: true })
    window.addEventListener('resize', handleScrollResize, { passive: true })
    window.addEventListener('message', handleMessage)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScrollResize)
      window.removeEventListener('resize', handleScrollResize)
      window.removeEventListener('message', handleMessage)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      style.remove()
      overlay.remove()
      parentOverlay.remove()
      label.remove()
      currentBlockRef.current = null
    }
  }, [isInsideIframe, enabled, accentColor, scrollAlign, scrollOffset])

  if (!isInsideIframe || !showToggle) return null

  if (ToggleComponent) {
    return <ToggleComponent enabled={enabled} onToggle={() => setEnabled((v) => !v)} />
  }

  const accent = accentColor ?? DEFAULT_ACCENT_COLOR

  return (
    <button
      onClick={() => setEnabled((v) => !v)}
      title={enabled ? 'Disable block sync' : 'Enable block sync'}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px 6px 8px',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        lineHeight: 1,
        color: enabled ? '#fff' : '#888',
        background: enabled ? accent : 'rgba(0,0,0,0.08)',
        boxShadow: enabled
          ? `0 2px 8px color-mix(in srgb, ${accent} 40%, transparent)`
          : '0 1px 4px rgba(0,0,0,0.12)',
        transition: 'background 200ms ease, color 200ms ease, box-shadow 200ms ease',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {enabled ? (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        )}
      </svg>
      {enabled ? 'Block sync' : 'Block sync'}
    </button>
  )
}
