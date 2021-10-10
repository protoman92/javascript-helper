import { AxiosInstance, AxiosRequestConfig } from "axios";
import { DocumentNode } from "graphql";

export default function ({
  axiosInstance,
}: Readonly<{ axiosInstance: AxiosInstance }>) {
  return {
    request: async <Args, Result>({
      url,
      document,
      variables,
      ...args
    }: Required<Pick<AxiosRequestConfig, "baseURL" | "url">> &
      Pick<AxiosRequestConfig, "headers"> &
      Readonly<{ document: DocumentNode; variables: Args }>) => {
      const { data } = await axiosInstance.post<Result>(
        url,
        { variables, query: document.loc?.source.body },
        args
      );

      return data;
    },
  };
}
