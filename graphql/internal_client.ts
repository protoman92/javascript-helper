import { graphql, GraphQLSchema } from "graphql";
import { InternalGraphQLClient } from "../interface";

export default function <Context>({
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

      const { data, errors } = await graphql<R>({
        ...args,
        contextValue: requestContext,
        schema: schemaFn(),
        source: document.loc!.source,
        variableValues: args.variables,
      });

      if (errors != null && errors.length > 0) throw errors[0];
      return data!;
    },
  };

  return client;
}
