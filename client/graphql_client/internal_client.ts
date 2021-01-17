import { DocumentNode, graphql, GraphQLArgs, GraphQLSchema } from "graphql";

export default function ({
  defaultContextValues = {},
  schemaFn,
}: Readonly<{ defaultContextValues?: object; schemaFn: () => GraphQLSchema }>) {
  return {
    request: async function <A, R>({
      contextValue = {},
      document,
      ...args
    }: Omit<GraphQLArgs, "schema" | "source" | "variableValues"> &
      Readonly<{ document: DocumentNode; variables: A }>) {
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
}
