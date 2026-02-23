import type { Config } from 'payload'
import type { BetterPreviewConfig } from './types'

export type { BetterPreviewConfig }

export const betterPreview =
  (pluginOptions?: BetterPreviewConfig) =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) {
      return config
    }

    return config
  }
