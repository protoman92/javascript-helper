import { AxiosInstance, AxiosRequestConfig } from "axios";
import { DocumentNode } from "graphql";

export type AxiosGraphQLClientRequest<Args, Result> = (
  args: Pick<AxiosRequestConfig, "baseURL" | "headers" | "url"> &
    Readonly<{ document: DocumentNode; variables: Args }>
) => Promise<Result>;

export default function createAxiosGraphQLClient({
  axiosInstance,
  ...defaultAxiosConfig
}: Pick<AxiosRequestConfig, "baseURL" | "url"> &
  Readonly<{ axiosInstance: AxiosInstance }>) {
  return {
    request: async <Args, Result>({
      document,
      variables,
      ...axiosConfig
    }: Parameters<AxiosGraphQLClientRequest<Args, Result>>[0]): ReturnType<
      AxiosGraphQLClientRequest<Args, Result>
    > => {
      const { data } = await axiosInstance.request<{
        data: Result;
        errors?: readonly Error[];
      }>({
        ...defaultAxiosConfig,
        ...axiosConfig,
        data: { variables, query: document.loc?.source.body },
        method: "post",
      });

      if (data.errors != null && data.errors?.length) {
        throw data.errors[0];
      }

      return data.data;
    },
  };
}
