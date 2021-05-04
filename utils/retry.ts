import { backOff } from "exponential-backoff";
import { GenericObject, PromisifiedClient } from "../interface";

export function wrapFunctionWithRetry<
  FN extends (...args: any[]) => Promise<any>
>(fn: FN, { times: numOfAttempts = 3 }: Readonly<{ times?: number }> = {}): FN {
  return ((...args) => backOff(() => fn(...args), { numOfAttempts })) as FN;
}

/**
 * This expects a key-value object client, and currently does not support class
 * instances.
 */
export function wrapClientWithBackoffRetry<
  C extends GenericObject,
  K extends Extract<keyof C, string> = Extract<keyof C, string>
>({
  client,
  keys = Object.keys(client) as K[],
  options,
}: Readonly<{
  client: C;
  keys?: K[];
  options?: Parameters<typeof wrapFunctionWithRetry>[1];
}>) {
  const newClient: Record<string, any> = { ...client };

  for (const key of keys) {
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

  return newClient as PromisifiedClient<C, K>;
}
