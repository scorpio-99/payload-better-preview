'use client'

import { useEffect, useRef } from 'react'
import { isScrollToBlockMessage, MESSAGE_PREFIX } from '../shared/messages'
import type { FocusBlockMessage } from '../shared/messages'

const ATTR = 'data-block'
const ATTR_INDEX = 'data-block-index'
const ATTR_NAME = 'data-block-name'

const COLORS = {
  border: 'rgba(59, 130, 246, 0.8)',
  bg: 'rgba(59, 130, 246, 0.05)',
  label: 'rgba(59, 130, 246, 0.9)',
  parentBorder: 'rgba(59, 130, 246, 0.4)',
  parentBg: 'rgba(59, 130, 246, 0.02)',
  flash: 'rgba(59, 130, 246, 0.25)',
}

const FLASH_DURATION = 1500

function createOverlay(dashed = false): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: dashed ? '9998' : '9999',
    border: dashed ? `2px dashed ${COLORS.parentBorder}` : `2px solid ${COLORS.border}`,
    borderRadius: '4px',
    background: dashed ? COLORS.parentBg : COLORS.bg,
    opacity: '0',
    transition: 'opacity 150ms ease, top 150ms ease, left 150ms ease, width 150ms ease, height 150ms ease',
  })
  return el
}

function createLabel(): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '10000',
    background: COLORS.label,
    color: '#fff',
    fontSize: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '0 0 4px 4px',
    whiteSpace: 'nowrap',
    opacity: '0',
    transition: 'opacity 150ms ease, top 150ms ease, left 150ms ease',
  })
  return el
}

function positionOverlay(
  overlay: HTMLDivElement,
  rect: DOMRect,
) {
  Object.assign(overlay.style, {
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity: '1',
  })
}

function positionLabel(
  label: HTMLDivElement,
  rect: DOMRect,
) {
  Object.assign(label.style, {
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    opacity: '1',
  })
}

function hideEl(el: HTMLDivElement) {
  el.style.opacity = '0'
}

function buildLabel(block: Element, parent?: Element | null): string {
  const type = block.getAttribute(ATTR) || 'block'
  const index = block.getAttribute(ATTR_INDEX)
  const name = block.getAttribute(ATTR_NAME)

  // 1-based display index
  const indexStr = index != null ? `#${Number(index) + 1}` : ''
  const typeStr = type.charAt(0).toUpperCase() + type.slice(1)
  const nameStr = name ? ` "${name}"` : ''

  if (parent) {
    const parentType = parent.getAttribute(ATTR) || 'block'
    const parentIndex = parent.getAttribute(ATTR_INDEX)
    const parentIndexStr = parentIndex != null ? `#${Number(parentIndex) + 1}` : ''
    const parentTypeStr = parentType.charAt(0).toUpperCase() + parentType.slice(1)
    return `${parentIndexStr} ${parentTypeStr} › ${indexStr} ${typeStr}${nameStr}`.trim()
  }

  return `${indexStr} ${typeStr}${nameStr}`.trim()
}

function flashHighlight(el: Element) {
  const rect = el.getBoundingClientRect()
  const flash = document.createElement('div')
  Object.assign(flash.style, {
    position: 'absolute',
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    background: COLORS.flash,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '4px',
    pointerEvents: 'none',
    zIndex: '9999',
    transition: `opacity ${FLASH_DURATION / 2}ms ease`,
    opacity: '1',
  })
  document.body.appendChild(flash)

  // Start fade-out after half the duration
  setTimeout(() => {
    flash.style.opacity = '0'
  }, FLASH_DURATION / 2)

  // Remove element after full duration
  setTimeout(() => {
    flash.remove()
  }, FLASH_DURATION)
}

export const PreviewToolbar: React.FC = () => {
  const currentBlockRef = useRef<Element | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const parentOverlayRef = useRef<HTMLDivElement | null>(null)
  const labelRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Only activate inside an iframe (draft mode + iframe = admin live preview)
    if (window.self === window.top) return

    const overlay = createOverlay()
    const parentOverlay = createOverlay(true)
    const label = createLabel()

    const style = document.createElement('style')
    style.textContent = `[${ATTR}] { cursor: pointer; }`
    document.head.appendChild(style)

    document.body.appendChild(overlay)
    document.body.appendChild(parentOverlay)
    document.body.appendChild(label)

    overlayRef.current = overlay
    parentOverlayRef.current = parentOverlay
    labelRef.current = label

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

      const block = document.querySelector(`[${ATTR_INDEX}="${e.data.index}"]`)
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

      block.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => flashHighlight(block), 400)
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

      const message: FocusBlockMessage = {
        type: `${MESSAGE_PREFIX}focus-block`,
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
    }
  }, [])

  return null
}
