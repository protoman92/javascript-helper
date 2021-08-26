import { shallowEqual } from "recompose";
import { DeepPartial, StrictOmit } from "ts-essentials";
import {
  ArrayOrSingle,
  DeepCloneReplacer,
  DeepCloneReviver,
  IfNotNullableOrUndefinable,
  Resolvable,
  Returnable,
} from "../interface";
import flipMutualExclusiveFlags from "./flip_exclusive_flags";
import createInterceptorRegistry from "./interceptor";
import createOptionSet from "./option_set";
import getAllPaginatedPages from "./paginate";
import runOnce from "./run_once";
import createSwitchAsyncFunction from "./switch_async";
import underscoreIDKeys from "./underscore_id_key";
export * from "./boolean_predicate";
export * from "./peer";
export * from "./retry";
export {
  createSwitchAsyncFunction,
  createInterceptorRegistry,
  createOptionSet,
  flipMutualExclusiveFlags,
  getAllPaginatedPages,
  runOnce,
  underscoreIDKeys,
};

export function analyzeError(err: any) {
  const {
    config: responseConfig = {},
    message,
    status: rootStatus = 500,
    response: {
      data: {
        config = responseConfig,
        description = message,
        error = description,
      } = {},
      status = rootStatus,
    } = {},
  } = err;

  let errorMessage: string;

  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Array) {
    /** In this case, the error was raised from express-validator */
    errorMessage = error.map(({ msg, param }) => `${msg}: ${param}`).join("\n");
  } else {
    errorMessage = error.message;
  }

  return { config, status, message: errorMessage };
}

export async function asyncTimeout(
  timeout: number,
  g?: typeof global | typeof window
) {
  let g2 = g;

  if (g2 == null) {
    try {
      g2 = window;
    } catch {}
  }

  if (g2 == null) {
    try {
      g2 = global;
    } catch {}
  }

  if (g2 == null) throw new Error("setTimeout is not defined");
  return new Promise((resolve) => g2!.setTimeout(resolve, timeout));
}

export function deepClone<T>(
  obj: T
): (
  ...replacers: readonly DeepCloneReplacer[]
) => (
  ...revivers: readonly DeepCloneReviver[]
) => undefined extends T ? T | undefined : T {
  return (...replacers) => {
    return (...revivers) => {
      const stringified = JSON.stringify(obj, (key, value) => {
        let replacedValue = value;

        for (const replacer of replacers) {
          replacedValue = replacer(key, replacedValue);
        }

        return replacedValue;
      });

      if (stringified === undefined) return undefined;

      return JSON.parse(stringified, (key, value) => {
        let revivedValue = value;

        for (const reviver of revivers) {
          revivedValue = reviver(key, revivedValue);
        }

        return revivedValue;
      });
    };
  };
}

export function isShallowEqual<T>(
  lhs: T | undefined,
  rhs: T | undefined
): boolean {
  return shallowEqual(lhs as any, rhs as any);
}

export function isType<T, K extends keyof T = keyof T>(
  object: unknown,
  ...keys: K[]
): object is T {
  if (typeof object !== "object" || object == null) return false;

  for (const key of keys) {
    if (key in object) continue;
    return false;
  }

  return true;
}

export function mockSomething<T>(override: DeepPartial<T>): T {
  return override as T;
}

export function omit<T, K extends keyof NonNullable<T>>(
  obj: T,
  ...keys: readonly K[]
): IfNotNullableOrUndefinable<
  T,
  T extends object ? StrictOmit<NonNullable<T>, K> : null
> {
  if (obj == null) return obj as any;
  if (typeof obj !== "object") return null as any;
  const objClone: Partial<T> = {};
  const keySet = new Set<keyof NonNullable<T>>(keys);

  for (const objKey in obj) {
    if (keySet.has(objKey as keyof T)) continue;
    objClone[objKey] = obj[objKey];
  }

  return objClone as any;
}

export const omitDeep = (() => {
  function isObject(obj: any): obj is {} {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  return <T>(obj: T, ...keys: string[]): T => {
    if (obj == null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((element) => omitDeep(element, ...keys)) as any;
    }

    if (obj instanceof Map) {
      return new Map(
        [...obj.entries()].map(([key, value]) => [
          key,
          omitDeep(value, ...keys),
        ])
      ) as any;
    }

    if (obj instanceof Set) {
      return new Set(omitDeep([...obj.values()], ...keys)) as any;
    }

    if (!isObject(obj)) return obj;
    const objClone: any = omit<any, any>(obj, ...keys);

    for (const key in objClone) {
      objClone[key] = omitDeep(objClone[key], ...keys);
    }

    return objClone;
  };
})();

export function omitFalsy<T extends { [x: string]: any }>(obj: T): Partial<T> {
  const newObject: Partial<T> = {};

  for (const key in obj) {
    if (!obj[key]) continue;
    newObject[key] = obj[key];
  }

  return newObject;
}

export function omitNull<T extends { [x: string]: any }>(obj: T) {
  const newObject: Partial<T> = {};

  for (const key in obj) {
    if (obj[key] == null) continue;
    newObject[key] = obj[key];
  }

  return newObject as Readonly<
    {
      [x in keyof T]: T[x] extends NonNullable<T[x]>
        ? T[x]
        : NonNullable<T[x]> | undefined;
    }
  >;
}

interface PickFunction {
  <T, K extends keyof T>(arr: T[], ...keys: readonly K[]): Pick<T, K>[];

  <T, K extends keyof T>(
    arr: readonly T[],
    ...keys: readonly K[]
  ): readonly Pick<T, K>[];

  <T, K extends keyof T>(obj: T, ...keys: readonly K[]): Pick<T, K>;
}

export const pick = function <T, K extends keyof T>(
  objOrArr: T | T[],
  ...keys: readonly K[]
) {
  if (objOrArr instanceof Array) {
    return objOrArr.map((obj) => pick(obj, ...keys));
  }

  return keys.reduce((acc, k) => Object.assign(acc, { [k]: objOrArr[k] }), {});
} as PickFunction;

/** Request all values of an object to be truthy, and throw an error otherwise */
export function requireAllTruthy<T>(
  args: T
): Readonly<{ [x in keyof T]: NonNullable<T[x]> }> {
  for (const key in args) if (!args[key]) throw new Error(`Falsy value ${key}`);
  return args as any;
}

export function requireFalse(
  value: boolean | null | undefined,
  message = "Expected false value"
): false {
  if (value === false) throw new Error(message);
  return false;
}

export function requireTrue(
  value: boolean | null | undefined,
  message = "Expected true value"
): true {
  if (value === true) throw new Error(message);
  return true;
}

export function requireNotNull<T>(
  obj: T | null | undefined,
  message = "Expected non-null value"
) {
  if (obj == null) throw new Error(message);
  return obj;
}

export function requireNull<T>(
  obj: T | null | undefined,
  message = "Expected non-null value"
) {
  if (obj != null) throw new Error(message);
}

export function requireTruthy<T>(args: T): NonNullable<T> {
  if (!args) throw new Error("Falsy value");
  return args as any;
}

export function wrapResolvable<T>(resolvable: Resolvable<T>): Promise<T> {
  if (resolvable instanceof Promise) return resolvable;
  return Promise.resolve(resolvable);
}

export function wrapReturnable<T, Args extends unknown[] = []>(
  returnable: Returnable<T, Args>
): Extract<typeof returnable, Function> {
  if (returnable instanceof Function) return returnable;
  return () => returnable;
}

export function stripLeadingSlash(str: string) {
  while (str.startsWith("/")) {
    str = str.slice(1);
  }

  return str;
}

interface ToArray {
  <T>(elemOrArray: ArrayOrSingle<T>): T[];
}

export const toArray = ((elemOrArray: ArrayOrSingle<any>) => {
  if (elemOrArray instanceof Array) return elemOrArray;
  return [elemOrArray];
}) as ToArray;

export function tuple<T1, T2>(element1: T1, element2: T2): [T1, T2] {
  return [element1, element2];
}

export function swapArrayIndexes<T>(
  array: T[] | readonly T[],
  i: number,
  j: number
) {
  const arrayClone = [...array];
  const iElement = arrayClone[i];
  arrayClone[i] = arrayClone[j];
  arrayClone[j] = iElement;
  return arrayClone;
}
