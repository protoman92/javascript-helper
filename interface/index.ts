import { IResolvers } from "apollo-server-express";
import { DocumentNode, GraphQLArgs } from "graphql";
import {
  GenericAsyncFunction,
  GenericFunction,
  GenericObject,
  Promised,
  Promisified,
  Resolvable,
} from "./essentials";
export * from "./essentials";
export * from "./i18n";
export * from "./peer";
export type {
  IResolvers as GraphQLResolvers,
  DocumentNode as GraphQLDocumentNode,
};

export type DeepCloneReplacer = (key: string, value: unknown) => unknown;
export type DeepCloneReviver = (key: string, value: unknown) => unknown;

export interface EventEmitterClient<
  CB extends { [x: string]: (...args: any[]) => void }
> {
  /** Use this only for type checking. It will not give the actual callbacks */
  callbacksType: CB;
  emit<K extends keyof CB>(key: K, ...args: Parameters<CB[K]>): void;
  getCallbackCount<K extends keyof CB>(key: K): number;
  on<K extends keyof CB>(key: K, callback: CB[K]): () => void;
  off<K extends keyof CB>(key: K, callback: CB[K]): void;
  offAll(): void;
}

export namespace InterceptorRegistry {
  export type InterceptorResult<FN extends GenericAsyncFunction> = Partial<
    Promised<ReturnType<FN>>
  >;

  export type Interceptor<FN extends GenericAsyncFunction> = (
    args: Readonly<{
      originalArguments: Parameters<FN>;
      previousResult: Partial<Promised<ReturnType<FN>>> | undefined;
    }>
  ) => Resolvable<InterceptorResult<FN>>;
}

export interface InterceptorRegistry<FN extends GenericAsyncFunction> {
  addInterceptor(interceptor: InterceptorRegistry.Interceptor<FN>): void;
  intercept(
    ...args: Parameters<FN>
  ): Promise<InterceptorRegistry.InterceptorResult<FN> | undefined>;
  interceptorType: FN;
  removeInterceptor(interceptor: InterceptorRegistry.Interceptor<FN>): void;
}

export type LocalStorageClient = typeof import("../client/local_storage_client")["defaultLocalStorageClient"];

export type PromisifiedClient<C extends GenericObject, K extends keyof C> = {
  [x in keyof Pick<C, K>]: C[x] extends GenericFunction
    ? Promisified<C[x]>
    : C[x];
} &
  Omit<C, K>;

export type ExternalGraphQLClient = ReturnType<
  typeof import("../graphql/external_client")["default"]
>;

export namespace InternalGraphQLClient {
  export interface RequestArgs<Context, A>
    extends Omit<
      GraphQLArgs,
      "contextValue" | "schema" | "source" | "variableValues"
    > {
    readonly contextValue?: Context;
    readonly document: DocumentNode;
    readonly variables: A;
  }
}

export interface InternalGraphQLClient<Context> {
  request<A, R>(
    args: InternalGraphQLClient.RequestArgs<Context, A>
  ): Promise<R>;
}

export interface LifecycleAware {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
}

export type Logger = ReturnType<typeof import("../client/logger")["default"]>;

export interface MessageSender<T> {
  sendMessage(message: T): void;
}
