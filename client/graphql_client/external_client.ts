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
) =>
  | Partial<Pick<typeof args, "context">>
  | Promise<Pick<Partial<typeof args>, "context">>;

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

  const errorInterceptors: ((error: Error) => void | Promise<void>)[] = [];
  const requestInterceptors: ExternalGraphQLRequestInterceptor<any, any>[] = [];

  const boostClient = {
    request: async function <A, R>(args: ExternalGraphQLRequestArgs<A, R>) {
      try {
        for (const interceptor of requestInterceptors) {
          const additionalArgs = await interceptor(args);
          args = { ...args, ...additionalArgs };
        }

        let data: R | null | undefined;
        let errors: readonly GraphQLError[] | undefined;

        if ("query" in args) {
          const queryPayload = await apollo.query<R | null | undefined>({
            fetchPolicy: "no-cache",
            ...args,
          });

          data = queryPayload.data;
          errors = queryPayload.errors;
        } else {
          const mutationPayload = await apollo.mutate({
            fetchPolicy: "no-cache",
            ...args,
          });

          data = mutationPayload.data;
          errors = mutationPayload.errors;
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
        for (const interceptor of errorInterceptors) interceptor(error);
        throw error;
      }
    },
    useErrorInterceptor: function (interceptor: typeof errorInterceptors[0]) {
      errorInterceptors.push(interceptor);
      return boostClient;
    },
    useRequestInterceptor: function (
      interceptor: typeof requestInterceptors[0]
    ) {
      requestInterceptors.push(interceptor);
      return boostClient;
    },
  };

  return boostClient;
}
