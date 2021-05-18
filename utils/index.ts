import { shallowEqual } from "recompose";
import { DeepPartial } from "ts-essentials";
import {
  ArrayOrSingle,
  DeepCloneReplacer,
  DeepCloneReviver,
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

export async function asyncTimeout(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export function deepClone<T>(
  obj: T
): (
  ...replacers: readonly DeepCloneReplacer[]
) => (...revivers: readonly DeepCloneReviver[]) => T {
  return (...replacers) => {
    return (...revivers) => {
      return JSON.parse(
        JSON.stringify(obj, (key, value) => {
          let replacedValue = value;

          for (const replacer of replacers) {
            replacedValue = replacer(key, replacedValue);
          }

          return replacedValue;
        }),
        (key, value) => {
          let revivedValue = value;

          for (const reviver of revivers) {
            revivedValue = reviver(key, revivedValue);
          }

          return revivedValue;
        }
      );
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

  return keys.reduce((args, k) => ({ ...args, [k]: objOrArr[k] }), {});
} as PickFunction;

/** Request all values of an object to be truthy, and throw an error otherwise */
export function requireAllTruthy<T>(
  args: T
): Readonly<{ [x in keyof T]: NonNullable<T[x]> }> {
  for (const key in args) if (!args[key]) throw new Error(`Falsy value ${key}`);
  return args as any;
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
