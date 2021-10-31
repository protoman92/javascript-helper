import { graphql, GraphQLArgs, GraphQLSchema } from "graphql";
import { GraphQLDocumentNode } from "./interface";

export namespace InternalGraphQLClient {
  export interface RequestArgs<Context, A>
    extends Omit<
      GraphQLArgs,
      "contextValue" | "schema" | "source" | "variableValues"
    > {
    readonly contextValue?: Context;
    readonly document: GraphQLDocumentNode;
    readonly variables: A;
  }
}

export interface InternalGraphQLClient<Context> {
  request<A, R>(
    args: InternalGraphQLClient.RequestArgs<Context, A>
  ): Promise<R>;
}

export function createInternalGraphQLClient<Context>({
  defaultContextValues = {},
  schemaFn,
}: Readonly<{
  defaultContextValues?: Partial<Context>;
  schemaFn: () => GraphQLSchema;
}>) {
  const client: InternalGraphQLClient<Context> = {
    request: async <A, R>({
      contextValue,
      document,
      ...args
    }: InternalGraphQLClient.RequestArgs<Context, A>) => {
      const requestContext = { ...defaultContextValues, ...contextValue };

      const { data, errors } = await graphql({
        ...args,
        contextValue: requestContext,
        schema: schemaFn(),
        source: document.loc!.source,
        variableValues: args.variables,
      });

      if (errors?.length) {
        throw errors[0];
      }

      return data as R;
    },
  };

  return client;
}
