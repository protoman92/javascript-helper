import {} from "util";

declare global {
  interface Map<K, V> {
    entryArray(): [K, V][];
    keyArray(): K[];
    map<V2>(mapper: (value: V) => V2): Map<K, V2>;
    valueArray(): V[];
  }
}

Map.prototype.entryArray = function () {
  return [...this.entries()];
};

Map.prototype.keyArray = function () {
  return [...this.keys()];
};

Map.prototype.map = function (mapper) {
  const newMap = new Map();

  for (const [key, value] of this) {
    newMap.set(key, mapper(value));
  }

  return newMap;
};

Map.prototype.valueArray = function () {
  return [...this.values()];
};
