'use client'

import { useEffect, useRef } from 'react'
import { ATTR, ATTR_INDEX } from './constants'
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

export const PreviewToolbar: React.FC = () => {
  const currentBlockRef = useRef<Element | null>(null)
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
