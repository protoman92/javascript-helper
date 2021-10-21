import { DeepPartial } from "ts-essentials";

export type ArrayOrSingle<T> = T | T[] | readonly T[];

export type ArrayToMap<
  T extends any[] | readonly any[],
  TKey extends keyof T[number]
> = Map<T[number][TKey], T[number]>;

export type GenericFunction = (...args: any[]) => any;
export type GenericAsyncFunction<T = any> = (...args: any[]) => Resolvable<T>;
export type GenericObject = { [x: string]: unknown };

export type IfNotNullableOrUndefinable<T, True> = null extends T
  ? True | null
  : undefined extends T
  ? True | undefined
  : True;

export type Promised<T> = T extends Promise<infer U> ? U : T;
export type Mapper<T1, T2 = T1> = (args: T1) => T2;
export type MapEntry<M> = M extends Map<infer K, infer V> ? [K, V] : never;
export type MapKey<M> = M extends Map<infer K, unknown> ? K : never;

export type MapFromObject<O> = O extends Record<infer K, infer V>
  ? Map<K, V>
  : never;

export type MapToObject<M> = M extends Map<infer K, infer V>
  ? Record<Extract<K, number | string | symbol>, V>
  : never;

export type MapValue<M> = M extends Map<unknown, infer V> ? V : never;

export type NonNullableProps<
  A extends Record<number | string | symbol, any>,
  K extends keyof A = keyof A
> = Required<{ [x in K]: NonNullable<A[x]> }> & Omit<A, K>;

export type Nullable<T> = T | null;
export type NullableProps<T> = { [x in keyof T]: Nullable<T[x]> };
export type Neverable<T> = T | null | undefined;
export type ObjectValue<O> = O extends Record<any, infer V> ? V : never;

export type Promisified<FN extends GenericFunction> =
  FN extends GenericAsyncFunction
    ? FN
    : (...args: Parameters<FN>) => Promise<ReturnType<FN>>;

export type Returnable<T, Args extends unknown[] = []> =
  | T
  | ((...args: Args) => T);

export type Resolvable<T> = T | Promise<T> | PromiseLike<T>;
export type SetToArray<T> = T extends Set<infer V> ? V[] : never;
export type SetValue<T> = T extends Set<infer V> ? V : never;

export interface Stack<T> {
  peek(): T | undefined;
  pop(): T | undefined;
  push(element: T): number;
  toArray(): T[];
}

export type UndefinableProps<T extends object> = {
  [K in keyof Required<T>]: T[K] | undefined;
};

export type WithDeepPartialReturn<FN extends (...args: any[]) => any> = (
  ...args: Parameters<FN>
) => ReturnType<FN> extends Promise<infer T>
  ? Promise<DeepPartial<T>>
  : DeepPartial<ReturnType<FN>>;
