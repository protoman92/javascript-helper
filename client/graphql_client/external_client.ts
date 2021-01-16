// @ts-ignore
import { buildAxiosFetch } from "@lifeomic/axios-fetch";
import {
  ApolloClient,
  ApolloClientOptions,
  InMemoryCache,
  MutationOptions,
  QueryOptions,
} from "apollo-boost";
import { setContext } from "apollo-link-context";
import { onError as createErrorLink } from "apollo-link-error";
import { createHttpLink } from "apollo-link-http";
import { GraphQLError } from "graphql";
import gql from "graphql-tag";
import { Resolvable } from "../../interface";
export {
  ApolloClient,
  buildAxiosFetch,
  createErrorLink,
  createHttpLink,
  gql,
  InMemoryCache,
  setContext,
};

export interface ExternalGraphQLRequestContext {
  readonly headers?: Readonly<Record<string, string>>;
}

export type ExternalGraphQLRequestArgs<A, R> = (
  | Omit<MutationOptions<R, A>, "context">
  | Omit<QueryOptions<A>, "context">
) &
  Readonly<{ context?: ExternalGraphQLRequestContext }>;

export type ExternalGraphQLRequestInterceptor<A, R> = (
  args: ExternalGraphQLRequestArgs<A, R>
) => Resolvable<Pick<Partial<typeof args>, "context">>;

export namespace ExternalGraphQLErrorInterceptorResult {
  export interface Noop {
    readonly type: "NOOP";
  }

  export interface Retry<A, R> {
    readonly overrideRequest?: ExternalGraphQLRequestArgs<A, R>;
    readonly type: "RETRY";
  }
}

export type ExternalGraphQLErrorInterceptorResult<A, R> =
  | ExternalGraphQLErrorInterceptorResult.Noop
  | ExternalGraphQLErrorInterceptorResult.Retry<A, R>;

export type ExternalGraphQLErrorInterceptor<A, R> = (
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

export default function (
  boostOrOptions: ApolloClient<unknown> | ApolloClientOptions<unknown>
) {
  const apollo = (() => {
    if (boostOrOptions instanceof ApolloClient) return boostOrOptions;
    return new ApolloClient(boostOrOptions);
  })();

  const errorInterceptors: ExternalGraphQLErrorInterceptor<any, any>[] = [];
  const requestInterceptors: ExternalGraphQLRequestInterceptor<any, any>[] = [];

  const client = {
    /**
     * Send a GraphQL request without interceptors. This can be overriden
     * to provide additional functionalities, such as retries.
     */
    requestWithoutInterceptors: async <A, R>(
      args: ExternalGraphQLRequestArgs<A, R>
    ) => {
      try {
        let data: R | null | undefined;
        let errors: readonly GraphQLError[] | undefined;

        if ("query" in args) {
          const payload = await apollo.query<R | null | undefined>({
            fetchPolicy: "no-cache",
            ...args,
          });

          data = payload.data;
          errors = payload.errors;
        } else {
          const payload = await apollo.mutate({
            fetchPolicy: "no-cache",
            ...args,
          });

          data = payload.data;
          errors = payload.errors;
        }

        if (errors != null && errors.length > 0) {
          throw extractGraphQLError(errors[0]);
        }

        if (data == null) {
          throw new Error("Expected data, instead got invalid");
        }

        return data;
      } catch (error) {
        /** Remove the "GraphQL error: " prefix */
        const [, messageWithoutPrefix = error.message] =
          error.message.match(/GraphQL error:\s(.*)/) || [];

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
          const errorResult = await interceptor({ error, request: args });

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
