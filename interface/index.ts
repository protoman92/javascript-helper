import { PeerConnection } from "../client/peer_client_factory";

export type Promised<T> = T extends Promise<infer U> ? U : T;
export type MapEntry<M> = M extends Map<infer K, infer V> ? [K, V] : never;
export type MapKey<M> = M extends Map<infer K, unknown> ? K : never;

export type MapFromObject<O> = O extends Record<infer K, infer V>
  ? Map<K, V>
  : never;

export type MapToObject<M> = M extends Map<infer K, infer V>
  ? Record<Extract<K, number | string | symbol>, V>
  : never;

export type MapValue<M> = M extends Map<unknown, infer V> ? V : never;

export type NonNullableProps<
  A extends { [x: string]: unknown },
  K extends keyof A = keyof A
> = Readonly<
  { [x in keyof A]: x extends K ? Required<NonNullable<A[x]>> : A[x] }
>;

export type Resolvable<T> = T | Promise<T> | PromiseLike<T>;

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

export type LocalStorageClient = typeof import("../client/local_storage_client")["defaultLocalStorageClient"];

export type Promisified<FN extends (...args: any[]) => any> = FN extends (
  ...args: any[]
) => Promise<any>
  ? FN
  : (...args: Parameters<FN>) => Promise<ReturnType<FN>>;

export type PromisifiedClient<C extends AnyClient, K extends keyof C> = {
  [x in keyof Pick<C, K>]: Promisified<C[x]>;
} &
  Omit<C, K>;

export type ExternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/external_client")["default"]
>;

export type InternalGraphQLClient = ReturnType<
  typeof import("../client/graphql_client/internal_client")["default"]
>;

export interface LifecycleAware {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
}

export type Logger = ReturnType<typeof import("../client/logger")["default"]>;

export interface MessageSender<T> {
  sendMessage(message: T): void;
}

export namespace ManyToOnePeerClient {
  namespace OutgoingConnectionUpdateArgs {
    interface BaseArgs {
      readonly allPeers: Readonly<{ id: string }>[];
    }

    export interface PeerJoining extends BaseArgs {
      readonly joiningPeerID: string;
      readonly type: "PEER_JOINING";
    }

    export interface PeerLeaving extends BaseArgs {
      readonly leavingPeerID: string;
      readonly type: "PEER_LEAVING";
    }
  }

  type OutgoingConnectionUpdateArgs =
    | OutgoingConnectionUpdateArgs.PeerJoining
    | OutgoingConnectionUpdateArgs.PeerLeaving;

  export type Callbacks<SubscribeeData> = Readonly<{
    connectionOpen: (conn: PeerConnection) => void;
    outgoingConnectionUpdate: (args: OutgoingConnectionUpdateArgs) => void;
    retryCancel: () => void;
    retryElapse: (elapsed: number) => void;
    subscribeeDataReceive: (data: SubscribeeData) => void;
  }>;
}
export interface ManyToOnePeerClient<SubscribeeData>
  extends LifecycleAware,
    Pick<
      EventEmitterClient<ManyToOnePeerClient.Callbacks<SubscribeeData>>,
      "callbacksType" | "off" | "on"
    >,
    MessageSender<SubscribeeData> {}

export type PeerClientFactory = ReturnType<
  typeof import("../client/peer_client_factory")["default"]
>;

export type PeerClient = ReturnType<PeerClientFactory["newInstance"]>;
