import { backOff } from "exponential-backoff";
import { shallowEqual } from "recompose";
import { AnyClient, PromisifiedClient } from "../interface";
import flipMutualExclusiveFlags from "./flip_exclusive_flags";
export { flipMutualExclusiveFlags };

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

export function wrapFunctionWithRetry<
  FN extends (...args: any[]) => Promise<any>
>(fn: FN, { times: numOfAttempts = 3 }: Readonly<{ times?: number }> = {}): FN {
  return ((...args) => backOff(() => fn(...args), { numOfAttempts })) as FN;
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

/**
 * This expects a key-value object client, and currently does not support class
 * instances.
 */
export function wrapClientWithBackoffRetry<C extends AnyClient>(
  client: C,
  options?: Parameters<typeof wrapFunctionWithRetry>[1]
) {
  const newClient: Record<string, any> = {};

  for (const key in client) {
    const fn = client[key];

    newClient[key] = (() => {
      if (fn instanceof Function) {
        return wrapFunctionWithRetry(
          async (...args: readonly any[]) => fn(...args),
          options
        );
      } else {
        return fn;
      }
    })();
  }

  return newClient as PromisifiedClient<C>;
}
