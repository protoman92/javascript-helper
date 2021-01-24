import {
  concat,
  defer,
  Observable,
  race,
  Subscription,
  throwError,
  TimeoutError,
  timer,
} from "rxjs";
import {
  finalize,
  mergeMap,
  switchMap,
  switchMapTo,
  take,
  tap,
} from "rxjs/operators";
import {
  ManyToOnePeerClient,
  PeerClientFactory,
  PeerConnection,
  PeerEvent,
} from "../interface";
import { retryDelay } from "../rxjs";
import createEventEmitterClient from "./event_emitter_client";

export namespace ManyToOnePeerClientArgs {
  interface BaseArgs {
    readonly peerClientFactory: PeerClientFactory;
    readonly retryDelay?: number;
    readonly subscribeeID: string;
  }

  export interface ForSubscribee extends BaseArgs {
    readonly type: "SUBSCRIBEE";
  }

  export interface ForSubscriber extends BaseArgs {
    /**
     * Timeout duration for connection open event. If the subscriber subscribes
     * to the target peer, it could be possible that the latter has not joined
     * the peer pool yet. Timing out allows us to retry the connection.
     */
    readonly connectionOpenTimeout?: number;
    readonly subscriberID: string;
    readonly type: "SUBSCRIBER";
  }
}

export type ManyToOnePeerClientArgs =
  | ManyToOnePeerClientArgs.ForSubscribee
  | ManyToOnePeerClientArgs.ForSubscriber;

const DELAY_DEFAULT_RETRY_PEER_OR_CONNECTION_ERROR = 1000;
const DELAY_DEFAULT_CONNECTION_OPEN_TIMEOUT = 1000;

/**
 * This peer client assumes there is a subscribee that everyone else subscribes
 * to, and subscribers do not subscribe to each other. It can be used as the
 * base to build more complex functionalities, such as many-to-many peer client.
 */
export default function <SubscribeeData>({
  peerClientFactory,
  retryDelay: retryDelayMs = DELAY_DEFAULT_RETRY_PEER_OR_CONNECTION_ERROR,
  ...args
}: ManyToOnePeerClientArgs) {
  const eventEmitter = createEventEmitterClient<
    ManyToOnePeerClient.Callbacks<SubscribeeData>
  >();

  const compositeSubscription: Subscription = new Subscription();
  let peerConnections: Map<string, PeerConnection> = new Map();
  let peerID: string;

  if (args.type === "SUBSCRIBER") {
    peerID = args.subscriberID;
  } else {
    peerID = args.subscribeeID;
  }

  const peerClient = peerClientFactory.newInstance(peerID);

  const onAllConnectionEventReceive = (event: PeerEvent<SubscribeeData>) => {
    if (event.type === "DATA") {
      eventEmitter.emit("dataReceive", { data: event.data });
    }
  };

  function onSingleConnectionEventReceive(
    connection: PeerConnection,
    event: PeerEvent<SubscribeeData>
  ) {
    switch (event.type) {
      case "OPEN":
        eventEmitter.emit("connectionOpen", { connection });
        peerConnections.set(connection.peer, connection);

        eventEmitter.emit("outgoingConnectionUpdate", {
          allPeers: [...peerConnections.keys()].map((id) => ({ id })),
          joiningPeerID: connection.peer,
          type: "PEER_JOINING",
        });

        break;

      default:
        break;
    }
  }

  function onSingleConnectionFinalize(connection: PeerConnection) {
    if (peerConnections.delete(connection.peer)) {
      eventEmitter.emit("outgoingConnectionUpdate", {
        allPeers: [...peerConnections.keys()].map((id) => ({ id })),
        leavingPeerID: connection.peer,
        type: "PEER_LEAVING",
      });
    }
  }

  async function deinitialize() {
    peerConnections = new Map();
    compositeSubscription.unsubscribe();
    await peerClient.deinitialize();
  }

  async function initialize() {
    await peerClient.initialize();
    let eventStream: Observable<PeerEvent<SubscribeeData>>;

    if (args.type === "SUBSCRIBEE") {
      eventStream = peerClient.onPeerConnection().pipe(
        mergeMap((conn) =>
          peerClient.streamPeerEvents<SubscribeeData>(conn).pipe(
            tap((event) => onSingleConnectionEventReceive(conn, event)),
            finalize(() => onSingleConnectionFinalize(conn))
          )
        )
      );
    } else {
      const {
        connectionOpenTimeout = DELAY_DEFAULT_CONNECTION_OPEN_TIMEOUT,
      } = args;

      function connectToPeer(): Observable<PeerEvent<SubscribeeData>> {
        return concat(
          defer(() =>
            peerClient.connectToPeer(args.subscribeeID, { reliable: true })
          ).pipe(
            switchMap((conn) =>
              race([
                peerClient
                  .streamPeerEvents<SubscribeeData>(conn)
                  .pipe(
                    tap((event) => onSingleConnectionEventReceive(conn, event))
                  ),
                /**
                 * We might face an inifinite wait situation if the subscribee
                 * joins after the subscribers, so timing out here allows the
                 * subscribers to retry connecting.
                 */
                timer(connectionOpenTimeout).pipe(
                  take(1),
                  switchMapTo(throwError(TimeoutError))
                ),
              ]).pipe(finalize(() => onSingleConnectionFinalize(conn)))
            ),
            retryDelay({ delayMs: retryDelayMs, retryCount: Infinity })
          ),
          /**
           * Even when the connection closes and the previous stream completes,
           * retry again to handle case where the peer reloads their browser,
           * after which they would reasonably expect to be reconnected.
           */
          defer(() =>
            timer(retryDelayMs).pipe(take(1), switchMapTo(connectToPeer()))
          )
        );
      }

      eventStream = connectToPeer();
    }

    const subscription = eventStream.subscribe(onAllConnectionEventReceive);
    compositeSubscription.add(subscription);
  }

  const manyToOneClient: ManyToOnePeerClient<SubscribeeData> = {
    ...(eventEmitter as Pick<
      typeof eventEmitter,
      "callbacksType" | "on" | "off"
    >),
    deinitialize,
    initialize,
    sendMessage: (data: SubscribeeData) => {
      for (const [, connection] of peerConnections) connection.send(data);
    },
  };

  return manyToOneClient;
}
