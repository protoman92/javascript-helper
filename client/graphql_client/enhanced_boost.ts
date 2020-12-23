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

export default function (
  boostOrOptions: ApolloClient<unknown> | ApolloClientOptions<unknown>
) {
  const apollo = (() => {
    if (boostOrOptions instanceof ApolloClient) return boostOrOptions;
    return new ApolloClient(boostOrOptions);
  })();

  return {
    request: async <A, R>(args: BoostRequestArgs<A, R>) => {
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

        if (!!errors && !!errors.length) throw errors[0];
        if (!data) throw new Error("Expected data, instead got invalid");
        return data;
      } catch (e) {
        if (
          "networkError" in e &&
          e.networkError != null &&
          "result" in e.networkError &&
          "errors" in e.networkError.result &&
          e.networkError.result.errors instanceof Array
        ) {
          const [{ message }] = e.networkError.result.errors;
          throw new Error(message);
        }

        if ("graphQLErrors" in e && e.graphQLErrors instanceof Array) {
          const [{ message = "" } = {}] = e.graphQLErrors;
          throw new Error(message);
        }

        throw e;
      }
    },
  };
}
