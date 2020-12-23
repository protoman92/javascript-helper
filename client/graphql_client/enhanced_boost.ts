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

export type BoostRequestArgs<A, R> = MutationOptions<R, A> | QueryOptions<A>;

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

  const errorInterceptors: ((error: Error) => void)[] = [];

  const boostClient = {
    request: async function <A, R>(args: BoostRequestArgs<A, R>) {
      try {
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
  };

  return boostClient;
}
