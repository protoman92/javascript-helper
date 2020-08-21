export type AnyClient = Readonly<{ [x: string]: (...args: any[]) => any }>;
export type Promised<T> = T extends Promise<infer U> ? U : T;

export type Promisified<FN extends (...args: any[]) => any> = FN extends (
  ...args: any[]
) => Promise<any>
  ? FN
  : (...args: Parameters<FN>) => Promise<ReturnType<FN>>;

export type PromisifiedClient<C extends AnyClient> = {
  [x in keyof C]: Promisified<C[x]>;
};

export type BoostClient = ReturnType<
  typeof import("../client/graphql_client/enhanced_boost")["default"]
>;
export type InternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/internal_client")["default"]
>;
export type Logger = ReturnType<typeof import("../client/logger")["default"]>;
