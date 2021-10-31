import {
  DeepPartial,
  GenericFunction,
  MapKey,
  MapValue,
} from "@haipham/javascript-helper-essential-types";
import { compose } from "@haipham/javascript-helper-utils";

export type HigherOrderDescribe = () => GenericFunction;

/** Compose a series of higher-order describe functions together into one */
export function composeDescribe(...hfns: readonly HigherOrderDescribe[]) {
  return compose(
    ...hfns.map((hfn) => {
      return (fn: GenericFunction) => {
        return (...args: Parameters<typeof fn>) => {
          fn();
          hfn()(...args);
        };
      };
    })
  );
}

export function mockSomething<T>(override: DeepPartial<T>): T {
  return override as T;
}

export function mockSomeParameters<FN extends (...args: any[]) => any>(
  ...override: DeepPartial<Parameters<FN>>
): Parameters<FN> {
  return override as Parameters<FN>;
}

interface MockMap {
  <M extends Map<any, any> | null | undefined>(
    ...args: DeepPartial<[MapKey<M>, MapValue<M>]>[]
  ): NonNullable<M>;

  <K, V>(...args: DeepPartial<[K, V][]>): Map<K, V>;
}

export const mockMap: MockMap = (...args: any[]) => new Map(args as any);
