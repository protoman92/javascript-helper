import {} from "util";

declare global {
  interface Set<T> {
    toArray(): T[];
  }
}

Set.prototype.toArray = function () {
  return [...this.values()];
};
