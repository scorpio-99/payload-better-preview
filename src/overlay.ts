import { ATTR, ATTR_INDEX, ATTR_NAME, FLASH_DURATION } from './constants'

type Colors = ReturnType<typeof import('./constants').makeColors>

export function createOverlay(dashed: boolean, colors: Colors): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: dashed ? '9998' : '9999',
    border: dashed ? `2px dashed ${colors.parentBorder}` : `2px solid ${colors.border}`,
    borderRadius: '4px',
    background: dashed ? colors.parentBg : colors.bg,
    opacity: '0',
    transition: 'opacity 150ms ease, top 150ms ease, left 150ms ease, width 150ms ease, height 150ms ease',
  })
  return el
}

export function createLabel(colors: Colors): HTMLDivElement {
  const el = document.createElement('div')
  Object.assign(el.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '10000',
    background: colors.label,
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

export function positionOverlay(overlay: HTMLDivElement, rect: DOMRect) {
  Object.assign(overlay.style, {
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity: '1',
  })
}

export function positionLabel(label: HTMLDivElement, rect: DOMRect) {
  Object.assign(label.style, {
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    opacity: '1',
  })
}

export function hideEl(el: HTMLDivElement) {
  el.style.opacity = '0'
}

export function buildLabel(block: Element, parent?: Element | null): string {
  const type = block.getAttribute(ATTR) || 'block'
  const index = block.getAttribute(ATTR_INDEX)
  const name = block.getAttribute(ATTR_NAME)

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

export function flashHighlight(el: Element, colors: Colors) {
  const rect = el.getBoundingClientRect()
  const flash = document.createElement('div')
  Object.assign(flash.style, {
    position: 'absolute',
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    background: colors.flash,
    border: `2px solid ${colors.border}`,
    borderRadius: '4px',
    pointerEvents: 'none',
    zIndex: '9999',
    transition: `opacity ${FLASH_DURATION / 2}ms ease`,
    opacity: '1',
  })
  document.body.appendChild(flash)

  setTimeout(() => {
    flash.style.opacity = '0'
  }, FLASH_DURATION / 2)

  setTimeout(() => {
    flash.remove()
  }, FLASH_DURATION)
}
