import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { addTypenameToDocument } from "apollo-utilities";
import { GraphQLScalarType } from "graphql";
import { GraphQLDate, GraphQLDateTime } from "graphql-iso-date";
import gql from "graphql-tag";
import GraphQLJSON from "graphql-type-json";
import { Writable } from "ts-essentials";
import { Resolvable } from "../interface";
export { makeExecutableSchema } from "@graphql-tools/schema";
export { getDirectives, MapperKind, mapSchema } from "@graphql-tools/utils";
export { ApolloServer, toApolloError } from "apollo-server-express";
export { defaultFieldResolver, GraphQLSchema } from "graphql";
export { GraphQLDate, GraphQLDateTime } from "graphql-iso-date";
export { GraphQLJSONObject } from "graphql-type-json";
export { gql, GraphQLJSON };

export type ApolloServerPluginDefinition<Context> = ApolloServerPlugin<Context>;

export const GraphQLDateInput = new GraphQLScalarType({
  ...GraphQLDate.toConfig(),
  name: "DateInput",
});

export const GraphQLDateTimeInput = new GraphQLScalarType({
  ...GraphQLDateTime.toConfig(),
  name: "DateTimeInput",
});

export const addTypenameToDocumentApolloPlugin: ApolloServerPlugin<any> = {
  requestDidStart: async () => {
    return {
      didResolveOperation: async (request) => {
        if (request.document != null) {
          (request as Writable<typeof request>)["document"] =
            addTypenameToDocument(request.document);
        }
      },
    };
  },
};

/**
 * Prevent aliasing so that malicious users cannot use it to bypass
 * willSendResponse plugin.
 */
export function createPreventFieldAliasesPlugin({
  filterFields,
  onAliasError,
}: Readonly<{
  filterFields: (args: Readonly<{ fieldName: string }>) => boolean;
  onAliasError?: (args: Readonly<{ error: Error }>) => Resolvable<void>;
}>): ApolloServerPluginDefinition<any> {
  const ERROR_MARKER_CONTEXT = "__CannotAliasFieldErrorMessage";

  return {
    requestDidStart: async () => ({
      executionDidStart: async ({ context }) => ({
        willResolveField: ({ info }) => {
          const shouldPreventAliases = filterFields({
            fieldName: info.fieldName,
          });

          if (
            shouldPreventAliases &&
            info.fieldNodes.some(({ alias }) => !!alias?.value)
          ) {
            const errorMessage = `Cannot alias field ${info.fieldName}`;
            context[ERROR_MARKER_CONTEXT] = errorMessage;
            throw new Error(errorMessage);
          }
        },
      }),
      /**
       * Even though we've thrown an error above, we need to throw an error
       * again here to completely block the request. Otherwise, the client may
       * still receive the data shape (albeit with null values).
       */
      willSendResponse: async ({ context, response }) => {
        if (response.errors == null || !context[ERROR_MARKER_CONTEXT]) return;
        const error = new Error(context[ERROR_MARKER_CONTEXT]);
        if (onAliasError != null) await onAliasError({ error });
        throw error;
      },
    }),
  };
}

export type ContextFunction<InCtx, OutCtx> = (
  ctx: InCtx & Partial<OutCtx>
) => Promise<Partial<OutCtx>>;

/**
 * Combines several context functions together into one function that takes
 * care of multiple functionalities defined by its sub-parts.
 */
export function combineContextFunctions<InCtx, OutCtx>(
  ...fns: readonly ContextFunction<InCtx, OutCtx>[]
): ContextFunction<InCtx, OutCtx> {
  return async (args) => {
    let ctx = {} as OutCtx;

    for (const fn of fns) {
      ctx = { ...ctx, ...(await fn({ ...args, ...ctx })) };
    }

    return ctx;
  };
}

export type ResponseFormatter<Context> = NonNullable<
  import("apollo-server-core/src/graphqlOptions").GraphQLServerOptions<Context>["formatResponse"]
>;

/**
 * Combine several format response functions together into one function that
 * performs the formatting in serial order.
 */
export function combineResponseFormatters<Context>(
  ...fns: readonly ResponseFormatter<Context>[]
): ResponseFormatter<Context> {
  return (...[response, ...args]) => {
    for (const fn of fns) {
      response = fn(response, ...args) ?? response;
    }

    return response;
  };
}
