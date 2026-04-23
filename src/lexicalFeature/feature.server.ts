import { createServerFeature } from '@payloadcms/richtext-lexical'

export const BetterPreviewLexicalFeature = createServerFeature({
  feature: {
    ClientFeature: 'payload-better-preview/lexical#BetterPreviewClientFeature',
  },
  key: 'betterPreviewLexical',
})
