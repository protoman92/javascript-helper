import gql from "graphql-tag";
import GraphQLJSON from "graphql-type-json";
export { makeExecutableSchema } from "@graphql-tools/schema";
export { getDirectives, MapperKind, mapSchema } from "@graphql-tools/utils";
export { ApolloServer, toApolloError } from "apollo-server-express";
export { defaultFieldResolver, GraphQLSchema } from "graphql";
export { GraphQLDate, GraphQLDateTime } from "graphql-iso-date";
export { GraphQLJSONObject } from "graphql-type-json";
export { gql, GraphQLJSON };
export type ContextFunction<InCtx, OutCtx> = (ctx: InCtx) => Promise<OutCtx>;

/**
 * Combines several context functions together into one function that takes
 * care of multiple functionalities defined by its sub-parts.
 */
export function combineContextFunctions<InCtx, OutCtx>(
  ...fns: readonly ContextFunction<InCtx, Partial<OutCtx>>[]
): ContextFunction<InCtx, OutCtx> {
  return async (...args) => {
    let ctx = {} as OutCtx;

    for (const fn of fns) {
      ctx = { ...ctx, ...(await fn(...args)) };
    }

    return ctx;
  };
}
