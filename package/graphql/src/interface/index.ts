import {
  DocumentNode as GraphQLDocumentNode,
  GraphQLFieldResolver as GraphQLResolvers,
} from "graphql";
export type { GraphQLResolvers, GraphQLDocumentNode };

export type ExternalGraphQLClient = ReturnType<
  typeof import("../external_client")["default"]
>;

export type ExternalAxiosGraphQLClient = ReturnType<
  typeof import("../axios_external_client")["default"]
>;
