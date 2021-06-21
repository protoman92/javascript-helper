import { DeepPartial } from "ts-essentials";
import { MapKey, MapValue } from "../interface";

export function mockSomething<T>(override: DeepPartial<T>): T {
  return override as T;
}

export function mockSomeParameters<FN extends (...args: any[]) => any>(
  ...override: DeepPartial<Parameters<FN>>
): Parameters<FN> {
  return override as Parameters<FN>;
}

interface MockMap {
  <K, V>(...args: DeepPartial<[K, V][]>): Map<K, V>;

  <M extends Map<any, any> | null | undefined>(
    ...args: DeepPartial<[MapKey<M>, MapValue<M>]>[]
  ): NonNullable<M>;
}

export const mockMap: MockMap = (...args: any[]) => new Map(args as any);
