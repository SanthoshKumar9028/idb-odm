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

export function generateNumberId() {
  // 1. Get the current timestamp (milliseconds since 1970)
  let now = Date.now();

  let newValue;

  // 2. Logic to ensure it's ALWAYS higher
  if (now > generateNumberId.lastValue) {
    // If time has moved forward, use the current timestamp
    newValue = now;
  } else {
    // If the function is called so fast that the millisecond is the same,
    // or if the system clock was moved back, just increment the last value.
    newValue = generateNumberId.lastValue + 1;
  }

  generateNumberId.lastValue = newValue;

  return newValue;
}

generateNumberId.lastValue = Date.now();

export function generateStringId() {
  // 1. 4-byte Timestamp: seconds since epoch
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  // 2. 5-byte Random Value
  // Math.random() generates a float. We multiply to get up to 5 bytes (0xffffffffff)
  const randomValue = Math.floor(Math.random() * 0x10000000000)
    .toString(16)
    .padStart(10, '0');

  // 3. 3-byte Counter
  // Initialize the counter with a random value once per runtime
  if (typeof generateStringId.counter === 'undefined') {
    generateStringId.counter = Math.floor(Math.random() * 0x1000000);
  }

  const counter = (generateStringId.counter++ & 0xffffff)
    .toString(16)
    .padStart(6, '0');

  return timestamp + randomValue + counter;
}

generateStringId.counter = undefined as number | undefined;
