import { DocumentNode, graphql, GraphQLArgs, GraphQLSchema } from "graphql";

export default function ({
  schemaFn,
}: Readonly<{ schemaFn: () => GraphQLSchema }>) {
  return {
    request: async function <A, R>({
      document,
      ...args
    }: Omit<GraphQLArgs, "schema" | "source" | "variableValues"> &
      Readonly<{ document: DocumentNode; variables: A }>) {
      const { data, errors } = await graphql<R>({
        ...args,
        schema: schemaFn(),
        source: document.loc!.source,
        variableValues: args.variables,
      });

      if (!!errors && !!errors.length) throw errors[0];
      return data!;
    },
  };
}
