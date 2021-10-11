import { AxiosInstance, AxiosRequestConfig } from "axios";
import { DocumentNode } from "graphql";

export default function ({
  axiosInstance,
  ...defaultAxiosConfig
}: Pick<AxiosRequestConfig, "baseURL" | "url"> &
  Readonly<{ axiosInstance: AxiosInstance }>) {
  return {
    request: async <Args, Result>({
      url,
      document,
      variables,
      ...axiosConfig
    }: Pick<AxiosRequestConfig, "baseURL" | "headers" | "url"> &
      Readonly<{ document: DocumentNode; variables: Args }>) => {
      const { data } = await axiosInstance({
        ...defaultAxiosConfig,
        ...axiosConfig,
        data: { variables, query: document.loc?.source.body },
      });

      return data as Result;
    },
  };
}
