import { uniqWith } from "lodash-es";

interface ToMap<T> {
  (key: (element: T) => string): Map<string, T>;
  <K extends keyof T>(key: K | ((element: T) => T[K])): Map<K, T>;
}

interface ExtensibleArray<T> extends ArrayLike<T> {
  compactMap(): NonNullable<T>[];
  compactMap<T2>(
    mapper: (element: T) => T2 | null | undefined
  ): NonNullable<T2>[];
  mergeElements: T extends Record<string, any> ? () => T : never;
  /** Get the element at a particular index. This method can return undefined */
  elementAtIndex(index: number): T | undefined;
  first(): T | undefined;
  last(): T | undefined;
  /** Like slice, but operates from the right -> the left side */
  sliceRight(start: number, end?: number): T[];
  tap(fn: (element: T) => void): this;
  toMap: T extends Record<string, any> ? ToMap<T> : never;
  toSet(): Set<T>;
  unique(comparator?: (lhs: T, rhs: T) => boolean): T[];
}

declare global {
  interface ReadonlyArray<T> extends ExtensibleArray<T> {}
  interface Array<T> extends ExtensibleArray<T> {}
}

Array.prototype.compactMap = function (
  mapper: (element: any) => any = (element) => element
) {
  const cloned: any[] = [];

  for (const element of this) {
    const mapped = mapper(element);
    if (mapped == null) continue;
    cloned.push(mapped);
  }

  return cloned;
};

Array.prototype.elementAtIndex = function (index) {
  return this[index];
};

Array.prototype.first = function () {
  return this.elementAtIndex(0);
};

Array.prototype.last = function () {
  if (this.length === 0) return undefined;
  return this[this.length - 1];
};

Array.prototype.mergeElements = function () {
  let merged: Record<string, unknown> = {};

  for (const element of this) {
    merged = { ...merged, ...element };
  }

  return merged;
};

Array.prototype.sliceRight = function (start, end) {
  return this.slice(end == null ? 0 : this.length - end, this.length - start);
};

Array.prototype.tap = function (fn) {
  for (const element of this) fn(element);
  return this;
};

Array.prototype.toMap = function (
  this: any[],
  keyOrFn: string | ((...args: readonly any[]) => any)
) {
  const entries: [string, any][] = [];

  for (const element of this) {
    const key =
      keyOrFn instanceof Function ? keyOrFn(element) : element[keyOrFn];

    entries.push([key, element]);
  }

  return new Map(entries);
} as any;

Array.prototype.toSet = function () {
  return new Set(this);
};

Array.prototype.unique = function (comparator) {
  return uniqWith(this, comparator);
};
