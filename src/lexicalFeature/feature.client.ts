'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { BetterPreviewLexicalPlugin } from './plugin.js'

export const BetterPreviewClientFeature = createClientFeature({
  plugins: [{ Component: BetterPreviewLexicalPlugin, position: 'bottom' }],
})
