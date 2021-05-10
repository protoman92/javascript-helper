import {} from "util";

interface Indexable<T> {
  /** Get the element at a particular index. This method can return undefined */
  elementAtIndex(index: number): T | undefined;
  first(): T | undefined;
}

interface SetConvertible<T> {
  toSet(): Set<T>;
}

declare global {
  interface ReadonlyArray<T> extends Indexable<T>, SetConvertible<T> {}
  interface Array<T> extends Indexable<T>, SetConvertible<T> {}
}

Array.prototype.elementAtIndex = function (index) {
  return this[index];
};

Array.prototype.first = function () {
  return this.elementAtIndex(0);
};

Array.prototype.toSet = function () {
  return new Set(this);
};
