export type AnyClient = Readonly<{ [x: string]: (...args: any[]) => any }>;

export interface EventEmitterClient<
  CB extends { [x: string]: (...args: any[]) => void }
> {
  /** Use this only for type checking. It will not give the actual callbacks */
  callbacksType: CB;
  emit<K extends keyof CB>(key: K, ...args: Parameters<CB[K]>): void;
  getCallbackCount<K extends keyof CB>(key: K): number;
  on<K extends keyof CB>(key: K, callback: CB[K]): void;
  off<K extends keyof CB>(key: K, callback: CB[K]): void;
  offAll(): void;
}

export type LocalStorageClient = typeof import("../client/local_storage_client")["defaultLocalStorageClient"];

export type Promised<T> = T extends Promise<infer U> ? U : T;

export type Promisified<FN extends (...args: any[]) => any> = FN extends (
  ...args: any[]
) => Promise<any>
  ? FN
  : (...args: Parameters<FN>) => Promise<ReturnType<FN>>;

export type PromisifiedClient<C extends AnyClient> = {
  [x in keyof C]: Promisified<C[x]>;
};

export type ExternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/external_client")["default"]
>;

export type InternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/internal_client")["default"]
>;

export type Logger = ReturnType<typeof import("../client/logger")["default"]>;
export type MapEntry<M> = M extends Map<infer K, infer V> ? [K, V] : never;
export type MapKey<M> = M extends Map<infer K, unknown> ? K : never;
export type MapValue<M> = M extends Map<unknown, infer V> ? V : never;

export type NonNullableProps<
  A extends { [x: string]: unknown },
  K extends keyof A = keyof A
> = Readonly<
  { [x in keyof A]: x extends K ? Required<NonNullable<A[x]>> : A[x] }
>;
