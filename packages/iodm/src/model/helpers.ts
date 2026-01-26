import type { PostMessage } from './types';

export function isPostMessage(message?: unknown): message is PostMessage {
  if (
    !message ||
    typeof message !== 'object' ||
    !('model' in message) ||
    !('type' in message) ||
    !('event' in message)
  )
    return false;

  return (
    typeof message.event === 'string' &&
    typeof message.model === 'string' &&
    (message.type === 'pre' || message.type === 'post')
  );
}
