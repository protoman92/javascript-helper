export type ExternalApolloGraphQLClient = ReturnType<
  typeof import("../apollo_external_client")["createApolloGraphQLClient"]
>;

export type ExternalAxiosGraphQLClient = ReturnType<
  typeof import("../axios_external_client")["createAxiosGraphQLClient"]
>;
