import Peer, { DataConnection } from "peerjs";
import { Observable } from "rxjs";
import { EventEmitterClient, LifecycleAware, MessageSender } from ".";
export type PeerConnection = DataConnection;

export type PeerErrorType = "peer-unavailable";

declare namespace PeerEvent {
  interface BaseEvent {
    readonly peerID: string;
  }

  export interface Data<T> extends BaseEvent {
    readonly data: T;
    readonly type: "DATA";
  }

  export interface Open extends BaseEvent {
    readonly type: "OPEN";
  }
}

export type PeerEvent<T> = PeerEvent.Data<T> | PeerEvent.Open;

export namespace PeerState {
  export interface PeerError {
    readonly error: Error & Readonly<{ type?: PeerErrorType }>;
    readonly type: "ERROR";
  }

  export interface PeerOpen {
    readonly peerID: string;
    readonly type: "OPEN";
  }

  export interface PeerUnitialized {
    readonly type: "UNITIALIZED";
  }
}

export type PeerState =
  | PeerState.PeerError
  | PeerState.PeerOpen
  | PeerState.PeerUnitialized;

export interface PeerClient extends LifecycleAware {
  connectToPeer(
    ...args: Parameters<Peer["connect"]>
  ): Observable<PeerConnection>;

  onPeerConnection(): Observable<PeerConnection>;
  peerState$(): Observable<PeerState | undefined>;
  streamPeerEvents<T>(conn: PeerConnection): Observable<PeerEvent<T>>;
}

export type PeerClientFactory = ReturnType<
  typeof import("../client/peer_client_factory")["default"]
>;

export namespace ManyToOnePeerClient {
  interface ConnectionOpenArgs {
    readonly connection: PeerConnection;
  }

  interface DataReceiveArgs<SubscribeeData> {
    readonly data: SubscribeeData;
  }

  export namespace OutgoingConnectionUpdateArgs {
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

  export type OutgoingConnectionUpdateArgs =
    | OutgoingConnectionUpdateArgs.PeerJoining
    | OutgoingConnectionUpdateArgs.PeerLeaving;

  interface RetryElapseArgs {
    readonly elapsed: number;
  }

  export type Callbacks<SubscribeeData> = Readonly<{
    connectionOpen: (args: ConnectionOpenArgs) => void;
    dataReceive: (args: DataReceiveArgs<SubscribeeData>) => void;
    outgoingConnectionUpdate: (args: OutgoingConnectionUpdateArgs) => void;
    retryCancel: () => void;
    retryElapse: (args: RetryElapseArgs) => void;
  }>;
}

export interface ManyToOnePeerClient<SubscribeeData>
  extends LifecycleAware,
    Pick<
      EventEmitterClient<ManyToOnePeerClient.Callbacks<SubscribeeData>>,
      "callbacksType" | "off" | "on"
    >,
    MessageSender<SubscribeeData> {}
