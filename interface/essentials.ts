import { GenericAsyncFunction, GenericFunction } from ".";

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

export type Promisified<
  FN extends GenericFunction
> = FN extends GenericAsyncFunction
  ? FN
  : (...args: Parameters<FN>) => Promise<ReturnType<FN>>;

export type Resolvable<T> = T | Promise<T> | PromiseLike<T>;
