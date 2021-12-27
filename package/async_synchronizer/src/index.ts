import { Awaited } from "ts-essentials";

/** Ensure only one request can be running at a time */
export function createAsyncSynchronizer() {
  const requestQueue: (() => void)[] = [];
  let isRunning = false;

  return {
    synchronize: <FN extends (...args: any[]) => Promise<any> | any>(
      fn: FN
    ): FN => {
      return function synchronized(this: any, ...args1: Parameters<FN>) {
        if (isRunning) {
          return new Promise<Awaited<ReturnType<FN>>>((resolve) => {
            requestQueue.push(() => {
              resolve(synchronized.call(this, ...args1));
            });
          });
        } else {
          isRunning = true;

          return Promise.resolve(fn.call(this, ...args1)).finally(() => {
            isRunning = false;
            requestQueue.splice(0, 1)[0]?.call(undefined);
          });
        }
      } as FN;
    },
  };
}
