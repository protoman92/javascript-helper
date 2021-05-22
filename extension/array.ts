import {} from "util";

interface HasMergeableElements<T> {
  mergeElements: () => T extends Record<string, any> ? T : never;
}

interface Indexable<T> {
  /** Get the element at a particular index. This method can return undefined */
  elementAtIndex(index: number): T | undefined;
  first(): T | undefined;
}

interface SetConvertible<T> {
  toSet(): Set<T>;
}

declare global {
  interface ReadonlyArray<T>
    extends HasMergeableElements<T>,
      Indexable<T>,
      SetConvertible<T> {}

  interface Array<T>
    extends HasMergeableElements<T>,
      Indexable<T>,
      SetConvertible<T> {}
}

Array.prototype.elementAtIndex = function (index) {
  return this[index];
};

Array.prototype.first = function () {
  return this.elementAtIndex(0);
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
