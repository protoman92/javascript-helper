import {} from "util";

interface Indexable<T> {
  /** Get the element at a particular index. This method can return undefined */
  elementAtIndex(index: number): T | undefined;
}

declare global {
  interface ReadonlyArray<T> extends Indexable<T> {}
  interface Array<T> extends Indexable<T> {}
}

Array.prototype.elementAtIndex = function (index) {
  return this[index];
};
