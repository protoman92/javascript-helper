export type Promised<T> = T extends Promise<infer U> ? U : T;
export type BoostClient = ReturnType<
  typeof import("../client/graphql_client/enhanced_boost")["default"]
>;
export type InternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/internal_client")["default"]
>;
export type Logger = ReturnType<typeof import("../client/logger")["default"]>;
