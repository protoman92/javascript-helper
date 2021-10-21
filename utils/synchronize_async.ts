import { wrapResolvable } from ".";
import { GenericAsyncFunction, Promised } from "../interface";

/** Ensure only one request can be running at a time */
export default function createAsyncSynchronizer() {
  const requestQueue: (() => void)[] = [];
  let isRunning = false;

  return {
    synchronize: <FN extends GenericAsyncFunction>(fn: FN): FN => {
      return function synchronized(this: any, ...args1: Parameters<FN>) {
        if (isRunning) {
          return new Promise<Promised<ReturnType<FN>>>((resolve) => {
            requestQueue.push(() => {
              resolve(synchronized.call(this, ...args1));
            });
          });
        } else {
          isRunning = true;

          return wrapResolvable(fn.call(this, ...args1)).finally(() => {
            isRunning = false;
            requestQueue.splice(0, 1)[0]?.call(undefined);
          });
        }
      } as FN;
    },
  };
}
