import { DeepPartial } from "ts-essentials";

export function mockSomething<T>(override: DeepPartial<T>): T {
  return override as T;
}

export function mockSomeParameters<FN extends (...args: any[]) => any>(
  ...override: DeepPartial<Parameters<FN>>
): Parameters<FN> {
  return override as Parameters<FN>;
}
