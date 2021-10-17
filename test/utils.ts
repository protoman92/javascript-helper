import { DeepPartial } from "ts-essentials";
import { GenericFunction, MapKey, MapValue } from "../interface";

export type HigherOrderDescribe = (cb: GenericFunction) => GenericFunction;

export function composeDescribe(...hfns: HigherOrderDescribe[]) {
  return hfns.reduceRight(
    (acc, hfn) => {
      return (fn) => {
        return hfn(acc(fn));
      };
    },
    (fn) => {
      return fn;
    }
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
