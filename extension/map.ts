import {} from "util";

declare global {
  interface Map<K, V> {
    keyArray(): readonly K[];
    map<V2>(mapper: (value: V) => V2): Map<K, V2>;
    valueArray(): readonly V[];
  }
}

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
