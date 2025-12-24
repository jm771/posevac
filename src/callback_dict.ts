import { DefaultMap } from "./util";

export class CallbackDict<K, V> {
  private last_data = new Map();
  private listeners: DefaultMap<K, Set<(a: V) => void>> = new DefaultMap(
    () => new Set()
  );

  subscribe(key: K, func: (a: V) => void) {
    this.listeners.get(key).add(func);
  }

  unsub(key: K, func: (a: V) => void) {
    this.listeners.get(key).delete(func);
  }

  updateVal(key: K, val: V) {
    this.last_data.set(key, val);
    this.listeners.get(key).forEach((fn) => fn(val));
  }

  getLastData(c: K): V {
    return this.last_data.get(c);
  }
}
