import { shallowEqual } from "recompose";
import { Resolvable, Returnable } from "../interface";
import flipMutualExclusiveFlags from "./flip_exclusive_flags";
import createInterceptorRegistry from "./interceptor";
import createOptionSet from "./option_set";
import getAllPaginatedPages from "./paginate";
import applyPolyfills from "./polyfills";
import runOnce from "./run_once";
import underscoreIDKeys from "./underscore_id_key";
export * from "./boolean_predicate";
export * from "./peer";
export * from "./retry";
export {
  applyPolyfills,
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

export function wrapResolvable<T>(
  resolvable: Resolvable<T>
): Extract<typeof resolvable, Promise<T>> {
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

export function toArray<T>(elemOrArray: T | T[]): readonly T[] {
  if (elemOrArray instanceof Array) return elemOrArray;
  return [elemOrArray];
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
