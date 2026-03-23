export const ATTR = 'data-block'
export const ATTR_INDEX = 'data-block-index'
export const ATTR_NAME = 'data-block-name'
export const ATTR_FIELD = 'data-block-field'

export const DEFAULT_ACCENT_COLOR = '#3b82f6'

export function makeColors(accent: string) {
  const c = (pct: number) => `color-mix(in srgb, ${accent} ${pct}%, transparent)`
  return {
    border: c(80),
    bg: c(5),
    label: accent,
    parentBorder: c(40),
    parentBg: c(2),
    flash: c(25),
  }
}

export const FLASH_DURATION = 1500
