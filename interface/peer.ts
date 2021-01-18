import Peer, { DataConnection } from "peerjs";
import { Observable } from "rxjs";
import { EventEmitterClient, LifecycleAware, Mappable, MessageSender } from ".";
export type PeerConnection = DataConnection;

declare namespace PeerEvent {
  export interface Data<T> {
    readonly data: T;
    readonly type: "data";
  }

  export interface Open {
    readonly type: "open";
  }
}

export type PeerEvent<T> = (PeerEvent.Data<T> | PeerEvent.Open) & Readonly<{}>;

export namespace PeerState {
  export interface Open {
    readonly type: "open";
  }
}

export type PeerState = PeerState.Open;

export interface PeerClient extends LifecycleAware, Mappable {
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
