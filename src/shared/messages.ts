export const MESSAGE_PREFIX = 'better-preview:'

export type ScrollToBlockMessage = {
  type: `${typeof MESSAGE_PREFIX}scroll-to-block`
  index: number
}

export function isScrollToBlockMessage(data: unknown): data is ScrollToBlockMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data as ScrollToBlockMessage).type === `${MESSAGE_PREFIX}scroll-to-block` &&
    'index' in data &&
    typeof (data as ScrollToBlockMessage).index === 'number'
  )
}
