import {} from "util";

declare global {
  interface Set<T> {
    cloneShallow(): Set<T>;
    toArray(): T[];
  }
}

Set.prototype.cloneShallow = function () {
  return new Set(this);
};

Set.prototype.toArray = function () {
  return [...this.values()];
};
