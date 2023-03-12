import { DeepPartial } from "ts-essentials";

export function asyncTimeout(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, timeoutMs);
  });
}

export function formatTransformIgnorePatternsForPNPM(
  ...dependencies: string[]
): readonly string[] {
  return [`node_modules/(?!.pnpm|${dependencies.join("|")})`];
}

export function mockSomething<T>(override: DeepPartial<T>): T {
  return override as T;
}

export function mockSomeParameters<FN extends (...args: any[]) => any>(
  ...override: DeepPartial<Parameters<FN>>
): Parameters<FN> {
  return override as Parameters<FN>;
}

export function waitUntil(
  predicate: () => Promise<boolean> | boolean,
  {
    intervalMs = 100,
    timeoutErrorMessage = "Timed out",
    timeoutMs = 5000,
  }: Readonly<{
    intervalMs?: number;
    timeoutErrorMessage?: string;
    timeoutMs?: number;
  }> = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    async function _wait() {
      const success = await predicate();

      if (success) {
        resolve(undefined);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(timeoutErrorMessage));
      } else {
        setTimeout(_wait, intervalMs);
      }
    }

    _wait();
  });
}
