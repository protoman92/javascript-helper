import {
  ApolloClient,
  ApolloClientOptions,
  ApolloLink,
  concat,
  createHttpLink,
  gql,
  InMemoryCache,
  MutationOptions,
  QueryOptions,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError as createErrorLink } from "@apollo/client/link/error";
// @ts-ignore
import { buildAxiosFetch } from "@lifeomic/axios-fetch";
import { GraphQLError } from "graphql";
import {
  ArrayOrSingle,
  Resolvable,
  Returnable,
} from "@haipham/javascript-helper-essential-types";
import {
  omitDeep,
  requireNotNull,
  wrapResolvable,
  wrapReturnable,
} from "@haipham/javascript-helper-utils";
export {
  ApolloClient,
  ApolloLink,
  buildAxiosFetch,
  concat,
  createErrorLink,
  createHttpLink,
  gql,
  InMemoryCache,
  setContext,
};

interface ExternalGraphQLRequestContext {
  readonly headers?: Readonly<Record<string, ArrayOrSingle<string>>>;
}

export type ExternalGraphQLRequestArgs<A, R> = (
  | Omit<MutationOptions<R, A>, "context" | "fetchPolicy">
  | Omit<QueryOptions<A>, "context">
) &
  Readonly<{ context?: ExternalGraphQLRequestContext }>;

type ExternalGraphQLRequestInterceptor<A, R> = (
  args: ExternalGraphQLRequestArgs<A, R>
) => Resolvable<Pick<Partial<typeof args>, "context">>;

namespace ExternalGraphQLErrorInterceptorResult {
  export interface Noop {
    readonly type: "NOOP";
  }

  export interface Retry<A, R> {
    readonly overrideRequest?: ExternalGraphQLRequestArgs<A, R>;
    readonly type: "RETRY";
  }
}

type ExternalGraphQLErrorInterceptorResult<A, R> =
  | ExternalGraphQLErrorInterceptorResult.Noop
  | ExternalGraphQLErrorInterceptorResult.Retry<A, R>;

type ExternalGraphQLErrorInterceptor<A, R> = (
  args: Readonly<{ error: Error; request: ExternalGraphQLRequestArgs<A, R> }>
) => Resolvable<ExternalGraphQLErrorInterceptorResult<A, R>>;

export function extractGraphQLError(error: any): Error {
  if (
    "networkError" in error &&
    error.networkError != null &&
    "result" in error.networkError &&
    "errors" in error.networkError.result &&
    error.networkError.result.errors instanceof Array
  ) {
    const [{ message }] = error.networkError.result.errors;
    return new Error(message);
  }

  if ("graphQLErrors" in error && error.graphQLErrors instanceof Array) {
    const [{ message = "" } = {}] = error.graphQLErrors;
    return new Error(message);
  }

  return error;
}

export function createApolloGraphQLClient<Cache = unknown>(
  clientOrOptions: Returnable<
    Resolvable<ApolloClient<Cache> | ApolloClientOptions<Cache>>
  >
) {
  const asyncClient = (() => {
    const _ = wrapReturnable(clientOrOptions)();
    if (_ instanceof ApolloClient) return wrapResolvable(_);
    return wrapResolvable(_).then((options) => new ApolloClient(options));
  })();

  const errorInterceptors: ExternalGraphQLErrorInterceptor<any, any>[] = [];
  const requestInterceptors: ExternalGraphQLRequestInterceptor<any, any>[] = [];

  const client = {
    clearCache: () => asyncClient.then((client) => client.clearStore()),
    /** Only use this for type-checking */
    errorInterceptorType:
      (() => {}) as unknown as typeof errorInterceptors[number],
    /** Only use this for type-checking */
    requestArgsType: {} as ExternalGraphQLRequestArgs<any, any>,
    /** Only use this for type-checking */
    requestInterceptorType:
      (() => {}) as unknown as typeof requestInterceptors[number],
    /**
     * Send a GraphQL request without interceptors. This can be overriden
     * to provide additional functionalities, such as retries.
     */
    requestWithoutInterceptors: async <A, R>({
      variables,
      ...args
    }: ExternalGraphQLRequestArgs<A, R>) => {
      try {
        const client = await asyncClient;
        let data: R | null | undefined;
        let errors: readonly GraphQLError[] | undefined;

        /**
         * Remove __typename from input variables, otherwise a 400 may be
         * thrown, like 'Field "__typename" is not defined by type...'.
         */
        variables = omitDeep(variables, "__typename");

        if ("query" in args) {
          const payload = await client.query({
            fetchPolicy: "no-cache",
            ...args,
            variables,
          });

          data = payload.data;
          errors = payload.errors;
        } else {
          const payload = await client.mutate({ ...args, variables });
          data = payload.data;
          errors = payload.errors;
        }

        if (errors != null && errors.length > 0) {
          throw extractGraphQLError(errors[0]);
        }

        return requireNotNull(data);
      } catch (error) {
        /** Remove the "GraphQL error: " prefix */
        const [, messageWithoutPrefix = (error as any).message] =
          (error as any).message.match(/GraphQL error:\s(.*)/) || [];

        error = new Error(messageWithoutPrefix);
        throw error;
      }
    },
    /** Send a GraphQL request with interceptors */
    request: async <A, R>(
      args: ExternalGraphQLRequestArgs<A, R>
    ): Promise<R> => {
      try {
        for (const interceptor of requestInterceptors) {
          const additionalArgs = await interceptor(args);
          args = { ...args, ...additionalArgs };
        }

        const result = await client.requestWithoutInterceptors(args);
        return result;
      } catch (error) {
        for (const interceptor of errorInterceptors) {
          const errorResult = await interceptor({
            error: error as Error,
            request: args,
          });

          switch (errorResult.type) {
            case "NOOP":
              continue;

            case "RETRY":
              const newArgs = errorResult.overrideRequest ?? args;
              return client.request(newArgs);
          }
        }

        throw error;
      }
    },
    useErrorInterceptor: (interceptor: typeof errorInterceptors[0]) => {
      errorInterceptors.push(interceptor);
      return client;
    },
    useRequestInterceptor: (interceptor: typeof requestInterceptors[0]) => {
      requestInterceptors.push(interceptor);
      return client;
    },
  };

  return client;
}
