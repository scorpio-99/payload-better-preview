import type { Config } from 'payload'
import type { BetterPreviewConfig } from './types'

export type { BetterPreviewConfig }

export const betterPreview =
  (pluginOptions?: BetterPreviewConfig) =>
  (config: Config): Config => {
    if (pluginOptions?.disabled) {
      return config
    }

    // Inject AdminBlockSyncProvider into admin UI
    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    config.admin.components.providers = config.admin.components.providers || []
    config.admin.components.providers.push(
      'payload-better-preview/client#AdminBlockSyncProvider',
    )

    return config
  }
