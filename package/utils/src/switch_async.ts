import { wrapResolvable } from ".";
import {
  GenericAsyncFunction,
  Promised,
} from "@haipham/javascript-helper-essential-types";

/**
 * Create a new async function that can be cancelled anytime it's called with
 * new arguments. It's similar to rxjs's switchMap.
 */
export default function <FN extends GenericAsyncFunction>(
  fn: FN,
  callback: (
    args: Readonly<
      | { error?: undefined; result: Promised<ReturnType<FN>> }
      | { error: Error; result?: undefined }
    >
  ) => void
): (...args: Parameters<FN>) => void {
  let cancelFunction: (() => void) | undefined;

  return (...args) => {
    if (cancelFunction != null) cancelFunction();
    let isCancelled = false;

    cancelFunction = () => {
      isCancelled = true;
    };

    return wrapResolvable(fn(...args))
      .then((result) => {
        if (isCancelled) return;
        callback({ result });
      })
      .catch((error) => {
        if (isCancelled) return;
        callback({ error });
      });
  };
}
