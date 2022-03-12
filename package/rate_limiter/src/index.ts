import { AsyncOrSync } from "ts-essentials";

/**
 * Create a rate limiter that ensures only one request can be executed within
 * a certain window. This should be used in development only.
 */
export default function createRateLimiter<
  FN extends (...args: readonly any[]) => AsyncOrSync<void>
>(fn: FN, ms: number): FN {
  const pending: Function[] = [];
  let currentlyWaiting = false;

  function executeAndContinue(...args: Parameters<FN>): void {
    currentlyWaiting = true;
    fn(...args);

    setTimeout(() => {
      const [taskToExecute] = pending.splice(0, 1);
      currentlyWaiting = false;
      taskToExecute?.call(undefined);
    }, ms);
  }

  return ((...args: Parameters<FN>): void => {
    if (currentlyWaiting) {
      pending.push(() => {
        executeAndContinue(...args);
      });
    } else {
      executeAndContinue(...args);
    }
  }) as FN;
}
