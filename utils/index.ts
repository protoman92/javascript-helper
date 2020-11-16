import { backOff } from "exponential-backoff";
import { AnyClient, PromisifiedClient } from "../interface";

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

export function omitFalsy<T extends { [x: string]: any }>(obj: T): Partial<T> {
  return Object.entries(obj)
    .filter(([, v]) => !!v)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}) as Partial<T>;
}

export function omitNull<T extends { [x: string]: any }>(
  obj: T
): Readonly<
  {
    [x in keyof T]: T[x] extends NonNullable<T[x]>
      ? T[x]
      : NonNullable<T[x]> | undefined;
  }
> {
  return Object.entries(obj)
    .filter(([, v]) => v != null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}) as any;
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
  Object.entries(args).forEach(([key, value]) => {
    if (!value) throw new Error(`Falsy value ${key}`);
  });

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

/**
 * This expects a key-value object client, and currently does not support class
 * instances.
 */
export function wrapClientWithBackoffRetry<C extends AnyClient>(
  client: C,
  options?: Parameters<typeof wrapFunctionWithRetry>[1]
) {
  return Object.entries(client).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [k]: (() => {
        if (v instanceof Function) {
          return wrapFunctionWithRetry(
            async (...args: readonly any[]) => v(...args),
            options
          );
        } else {
          return v;
        }
      })(),
    }),
    {}
  ) as PromisifiedClient<C>;
}
