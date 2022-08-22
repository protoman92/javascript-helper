import {
  DeepPartial,
  Resolvable,
  Returnable
} from "@haipham/javascript-helper-essential-types";
import deepClone from "./deep_clone";
import flipMutualExclusiveFlags from "./flip_exclusive_flags";
import getAllPaginatedPages from "./paginate";
import runOnce from "./run_once";
import createSwitchAsyncFunction from "./switch_async";
import underscoreIDKeys from "./underscore_id_key";
export * from "./boolean_predicate";
export * from "./retry";
export {
  createSwitchAsyncFunction,
  deepClone,
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
  // @ts-ignore
  g?: typeof global | typeof window
) {
  let g2 = g;

  if (g2 == null) {
    try {
      // @ts-ignore
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

export function mockSomething<T>(override: DeepPartial<T>): T {
  return override as T;
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
