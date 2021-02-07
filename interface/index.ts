import { DocumentNode, GraphQLArgs } from "graphql";
import { Mapper, Promisified } from "./essentials";
export * from "./essentials";
export * from "./peer";

export type AnyClient = Readonly<{ [x: string]: (...args: any[]) => any }>;

export interface EventEmitterClient<
  CB extends { [x: string]: (...args: any[]) => void }
> {
  /** Use this only for type checking. It will not give the actual callbacks */
  callbacksType: CB;
  emit<K extends keyof CB>(key: K, ...args: Parameters<CB[K]>): void;
  getCallbackCount<K extends keyof CB>(key: K): number;
  on<K extends keyof CB>(key: K, callback: CB[K]): void;
  off<K extends keyof CB>(key: K, callback: CB[K]): void;
  offAll(): void;
}

export type GenericFunction = (...args: any[]) => any;
export type GenericAsyncFunction = (...args: any[]) => Promise<any>

export type LocalStorageClient = typeof import("../client/local_storage_client")["defaultLocalStorageClient"];

export interface Mappable {
  map<T>(fn: Mapper<this, T>): T;
}

export type PromisifiedClient<C extends AnyClient, K extends keyof C> = {
  [x in keyof Pick<C, K>]: Promisified<C[x]>;
} &
  Omit<C, K>;

export type ExternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/external_client")["default"]
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
