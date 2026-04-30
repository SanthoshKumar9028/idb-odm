import { describe, expect, it } from 'vitest';
import { generateNumberId, generateStringId, isPostMessage } from './helpers';

describe('isPostMessage', () => {
  it('should return true for a valid PostMessage object', () => {
    const validMessage = {
      model: 'testModel',
      type: 'pre' as const,
      event: 'save',
      payload: { data: 'test' },
    };
    expect(isPostMessage(validMessage)).toBe(true);
  });

  it('should return true for a valid PostMessage object with type "post"', () => {
    const validMessage = {
      model: 'testModel',
      type: 'post' as const,
      event: 'save',
      payload: { data: 'test' },
    };
    expect(isPostMessage(validMessage)).toBe(true);
  });

  it('should return false when message is falsy value', () => {
    expect(isPostMessage(undefined)).toBe(false);
    expect(isPostMessage(null)).toBe(false);
  });

  it('should return false when message is not an object', () => {
    expect(isPostMessage('string')).toBe(false);
    expect(isPostMessage(123)).toBe(false);
    expect(isPostMessage(true)).toBe(false);
    expect(isPostMessage([])).toBe(false);
  });

  it('should return false when message is missing required property', () => {
    expect(
      isPostMessage({
        type: 'pre' as const,
        event: 'save',
        payload: {},
      })
    ).toBe(false);
    expect(
      isPostMessage({
        model: 'testModel',
        event: 'save',
        payload: {},
      })
    ).toBe(false);
    expect(
      isPostMessage({
        model: 'testModel',
        type: 'pre' as const,
        payload: {},
      })
    ).toBe(false);
  });

  it('should return false when "model" or "event" is not a string', () => {
    expect(
      isPostMessage({
        model: 123,
        type: 'pre' as const,
        event: 'save',
        payload: {},
      })
    ).toBe(false);

    expect(
      isPostMessage({
        model: 'testModel',
        type: 'pre' as const,
        event: 123,
        payload: {},
      })
    ).toBe(false);
  });

  it('should return false when "type" is not "pre" or "post"', () => {
    const invalidMessage = {
      model: 'testModel',
      type: 'invalid' as any,
      event: 'save',
      payload: {},
    };
    expect(isPostMessage(invalidMessage)).toBe(false);
  });

  it('should return false when "type" is a number', () => {
    const invalidMessage = {
      model: 'testModel',
      type: 1 as any,
      event: 'save',
      payload: {},
    };
    expect(isPostMessage(invalidMessage)).toBe(false);
  });

  it('should return true even when "payload" is missing (based on current implementation)', () => {
    const messageWithoutPayload = {
      model: 'testModel',
      type: 'pre' as const,
      event: 'save',
    };
    expect(isPostMessage(messageWithoutPayload)).toBe(true);
  });
});

describe('generateNumberId', () => {
  it('should generate a increasing number', () => {
    const id1 = generateNumberId();
    const id2 = generateNumberId();
    expect(id2).greaterThan(id1);
  });
});

describe('generateStringId', () => {
  it('should generate unique string', () => {
    const id1 = generateStringId();
    const id2 = generateStringId();
    expect(id2).not.eq(id1);
  });
});
