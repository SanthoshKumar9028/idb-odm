import { describe, expect, it } from 'vitest';
import { VirtualType } from './VirtualType';

describe('VirtualType', () => {
  it('should be virtual by default', () => {
    const virtual = new VirtualType({ name: 'virtualField' });

    expect(virtual.getIsVirtual()).toBe(true);
    expect(virtual.name).toBe('virtualField');
  });

  it('should preserve custom isVirtual if passed', () => {
    const virtual = new VirtualType({ name: 'named', isVirtual: true });
    expect(virtual.getIsVirtual()).toBe(true);
  });

  it('castFrom should return input value', () => {
    const virtual = new VirtualType({ name: 'v' });
    expect(virtual.castFrom(123 as any)).toBe(123);
    expect(virtual.castFrom('abc')).toBe('abc');
    expect(virtual.castFrom({})).toEqual({});
  });

  it('applyGetters should call getter chain with doc context', () => {
    const virtual = new VirtualType<{ a: number }>({ name: 'v' });
    virtual.get(function (this: any, value) {
      return value + 1;
    });
    virtual.get(function (this: any, value) {
      return (this.a ?? 0) + value;
    });

    const result = virtual.applyGetters({ a: 10 }, { value: 5 });

    // 5 + 1 = 6; then 10 + 6 = 16
    expect(result).toBe(16);
  });

  it('applySetters should call setter chain with doc context', () => {
    const virtual = new VirtualType<{ b: number }>({ name: 'v' });
    virtual.set(function (this: any, value) {
      return value * 2;
    });
    virtual.set(function (this: any, value) {
      return (this.b ?? 0) + value;
    });

    const result = virtual.applySetters({ b: 5 }, { value: 3 });

    // 3*2 = 6; then 5+6 =11
    expect(result).toBe(11);
  });

  it('clone should copy getters, setters and name', () => {
    const virtual = new VirtualType<{ c: number }>({ name: 'v' });
    virtual.get(() => 'x');
    virtual.set(() => 'y');

    const copy = virtual.clone();

    expect(copy).not.toBe(virtual);
    expect(copy.name).toBe(virtual.name);
    expect(copy.getIsVirtual()).toBe(true);
    expect(copy.applyGetters({}, { value: 1 })).toBe('x');
    expect(copy.applySetters({}, { value: 1 })).toBe('y');

    // Ensure original not mutated by adding additional hooks to clone
    copy.get(() => 'z');
    expect(virtual.applyGetters({}, { value: 1 })).toBe('x');
  });
});
