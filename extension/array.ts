import { uniqWith } from "lodash-es";
import {} from "util";

interface ExtensibleArray<T> extends ArrayLike<T> {
  compactMap(): NonNullable<T>[];
  compactMap<T2>(
    mapper: (element: T) => T2 | null | undefined
  ): NonNullable<T2>[];
  mergeElements: () => T extends Record<string, any> ? T : never;
  /** Get the element at a particular index. This method can return undefined */
  elementAtIndex(index: number): T | undefined;
  first(): T | undefined;
  last(): T | undefined;
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

Array.prototype.toSet = function () {
  return new Set(this);
};

Array.prototype.unique = function (comparator) {
  return uniqWith(this, comparator);
};
