export function getOrThrow<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Key not found in map: ${key}`);
  }
  return value;
}

export function Assert(condition: boolean, message: string = "") {
  if (!condition) {
    throw Error(message);
  }
}

export function NotNull<T>(val: T | null | undefined): T {
  Assert(val !== null, "unexpected null value");
  Assert(val !== undefined, "unexpected null value");
  return val!;
}
