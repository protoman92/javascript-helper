import { cloneDeepWith } from "lodash-es";
import { PeerMessageCompatible } from "../interface";

const IDENTIFIER_KEY = "_peer_message_compatible_type";
const IDENTIFIER_VALUE_MAP = "map";
const IDENTIFIER_VALUE_SET = "set";

namespace TypeIdentifiable {
  export interface Map {
    [IDENTIFIER_KEY]: typeof IDENTIFIER_VALUE_MAP;
    [x: number]: unknown;
    [x: string]: unknown;
  }

  export interface Set {
    [IDENTIFIER_KEY]: typeof IDENTIFIER_VALUE_SET;
    [x: number]: unknown;
    length: number;
  }
}

type TypeIdentifiable = TypeIdentifiable.Map | TypeIdentifiable.Set;

export const serializePeerMessage = (() => {
  function customizer(value: unknown) {
    if (value instanceof Map) {
      const serialized: TypeIdentifiable.Map = {
        [IDENTIFIER_KEY]: IDENTIFIER_VALUE_MAP,
      };

      for (const [k, v] of value) serialized[k] = clone(v);
      return serialized;
    } else if (value instanceof Set) {
      const serialized: TypeIdentifiable.Set = {
        [IDENTIFIER_KEY]: IDENTIFIER_VALUE_SET,
        length: 0,
      };

      let currentIndex = 0;

      /**
       * To preserve the identifier key, we need to serialize the set into
       * an object with number keys, instead of an array, since the latter will
       * have its identifier key removed on message receipt.
       */
      for (const v of value) {
        serialized[currentIndex] = clone(v);
        currentIndex += 1;
      }

      serialized.length = currentIndex;
      return serialized;
    }

    return undefined;
  }

  function clone<T>(serializable: T): PeerMessageCompatible<T> {
    return cloneDeepWith(serializable, customizer);
  }

  return clone;
})();

export const deserializePeerMessage = (() => {
  function isTypeIdentifiable(value: unknown): value is TypeIdentifiable {
    return (
      typeof value === "object" && value != null && IDENTIFIER_KEY in value
    );
  }

  function isMapTypeIdentifiable(
    value: unknown
  ): value is TypeIdentifiable.Map {
    return (
      isTypeIdentifiable(value) &&
      value[IDENTIFIER_KEY] === IDENTIFIER_VALUE_MAP
    );
  }

  function isSetTypeIdentifiable(
    value: unknown
  ): value is TypeIdentifiable.Set {
    return (
      isTypeIdentifiable(value) &&
      value[IDENTIFIER_KEY] === IDENTIFIER_VALUE_SET
    );
  }

  function customizer(value: unknown) {
    if (isMapTypeIdentifiable(value)) {
      const deserialized = new Map();

      for (const k in value) {
        if (k === IDENTIFIER_KEY) continue;
        deserialized.set(k, clone(value[k]));
      }

      return deserialized;
    } else if (isSetTypeIdentifiable(value)) {
      const deserialized = new Set();
      const arrayLength = value.length;

      for (let index = 0; index < arrayLength; index += 1) {
        deserialized.add(clone(value[index]));
      }

      return deserialized;
    }

    return undefined;
  }

  function clone<T>(deserializable: PeerMessageCompatible<T>): T {
    return cloneDeepWith(deserializable, customizer);
  }

  return clone;
})();
