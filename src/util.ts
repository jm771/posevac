export function getOrThrow<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);

  if (value === undefined) {
    throw new Error(`Key not found in map: ${key}`);
  }
  return value;
}

export function Assert(
  condition: boolean,
  message: string = ""
): asserts condition {
  if (!condition) {
    throw Error(message);
  }
}

export function NotNull<T>(val: T | null | undefined): T {
  Assert(val !== null, "unexpected null value");
  Assert(val !== undefined, "unexpected null value");
  return val!;
}

export function mapIterable<T, U>(
  iterable: Iterable<T>,
  func: (val: T) => U
): U[] {
  const ret = [];

  for (const item of iterable) {
    ret.push(func(item));
  }

  return ret;
}

export class DefaultMap<K, V> extends Map<K, V> {
  constructor(private factory: () => V) {
    super();
  }

  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.factory());
    }
    return super.get(key)!;
  }
}
