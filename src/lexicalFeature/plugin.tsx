'use client'

import type { PluginComponent } from '@payloadcms/richtext-lexical'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

export const BetterPreviewLexicalPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const blockNodes: Array<{ key: string; id: string }> = []

      editorState.read(() => {
        const nodeMap = (editorState as any)._nodeMap as Map<string, any>
        for (const [nodeKey, node] of nodeMap) {
          const type = node.getType?.()
          if (type === 'block' || type === 'inlineBlock') {
            const fields = node.getFields?.()
            if (fields?.id) {
              blockNodes.push({ key: nodeKey, id: fields.id })
            }
          }
        }
      })

      for (const { key, id } of blockNodes) {
        const el = editor.getElementByKey(key)
        if (el && el.getAttribute('data-block-id') !== id) {
          el.setAttribute('data-block-id', id)
        }
      }
    })
  }, [editor])

  return null
}
