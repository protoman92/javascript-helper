import {
  interval,
  Observable,
  race,
  Subject,
  Subscription,
  throwError,
  TimeoutError,
  timer,
} from "rxjs";
import {
  finalize,
  mergeMap,
  mergeMapTo,
  take,
  takeUntil,
  tap,
} from "rxjs/operators";
import {
  ManyToOnePeerClient,
  PeerClientFactory,
  PeerConnection,
  PeerEvent,
} from "../interface";
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

const DELAY_DEFAULT_RETRY_PEER_OR_CONNECTION_ERROR = 5000;
const DELAY_DEFAULT_CONNECTION_OPEN_TIMEOUT = 1000;

/**
 * This peer client assumes there is a subscribee that everyone else subscribes
 * to, and subscribers do not subscribe to each other. It can be used as the
 * base to build more complex functionalities, such as many-to-many peer client.
 */
export default function <SubscribeeData>({
  peerClientFactory,
  retryDelay = DELAY_DEFAULT_RETRY_PEER_OR_CONNECTION_ERROR,
  ...args
}: ManyToOnePeerClientArgs) {
  const eventEmitter = createEventEmitterClient<
    ManyToOnePeerClient.Callbacks<SubscribeeData>
  >();

  const compositeSubscription: Subscription = new Subscription();
  const retryCancel$ = new Subject<void>();
  let peerConnections: Map<string, PeerConnection> = new Map();
  let peerID: string;

  if (args.type === "SUBSCRIBER") {
    peerID = args.subscriberID;
  } else {
    peerID = args.subscribeeID;
  }

  const peerClient = peerClientFactory.newInstance(peerID);

  compositeSubscription.add(
    retryCancel$.subscribe(() => eventEmitter.emit("retryCancel"))
  );

  const onAllConnectionEventReceive = (event: PeerEvent<SubscribeeData>) => {
    if (event.type === "DATA") {
      eventEmitter.emit("dataReceive", { data: event.data });
    }
  };

  const onAllConnectionErrorReceive = (_error: Error) => {
    eventEmitter.emit("retryElapse", { elapsed: 0 });

    const subscription = interval(1000)
      .pipe(take(retryDelay / 1000), takeUntil(retryCancel$))
      .subscribe(async (i) => {
        eventEmitter.emit("retryElapse", { elapsed: (i + 1) * 1000 });
        if (i === retryDelay / 1000 - 1) await initialize();
      });

    compositeSubscription.add(subscription);
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
          allPeers: [...peerConnections.keys()].map((key) => ({
            id: key,
          })),
          joiningPeerID: connection.peer,
          type: "PEER_JOINING",
        });

        break;

      default:
        break;
    }
  }

  function onSingleConnectionEventFinalize(connection: PeerConnection) {
    peerConnections.delete(connection.peer);

    eventEmitter.emit("outgoingConnectionUpdate", {
      allPeers: [...peerConnections.keys()].map((key) => ({
        id: key,
      })),
      leavingPeerID: connection.peer,
      type: "PEER_LEAVING",
    });
  }

  async function deinitialize() {
    peerConnections = new Map();
    compositeSubscription.unsubscribe();
    await peerClient.deinitialize();
  }

  async function initialize() {
    retryCancel$.next(undefined);
    await peerClient.initialize();
    let eventStream: Observable<PeerEvent<SubscribeeData>>;

    if (args.type === "SUBSCRIBEE") {
      eventStream = peerClient.onPeerConnection().pipe(
        mergeMap((connection) =>
          peerClient.streamPeerEvents<SubscribeeData>(connection).pipe(
            tap((event) => onSingleConnectionEventReceive(connection, event)),
            finalize(() => onSingleConnectionEventFinalize(connection))
          )
        )
      );
    } else {
      eventStream = peerClient
        .connectToPeer(args.subscribeeID, { reliable: true })
        .pipe(
          mergeMap((connection) =>
            race([
              peerClient.streamPeerEvents<SubscribeeData>(connection).pipe(
                tap((event) =>
                  onSingleConnectionEventReceive(connection, event)
                ),
                finalize(() => onSingleConnectionEventFinalize(connection))
              ),
              /**
               * We might face an inifinite waiting situation if the subscribee
               * joins after the subscribers, so timing out here allows the
               * subscribers to retry connecting.
               */
              timer(
                args.connectionOpenTimeout ||
                  DELAY_DEFAULT_CONNECTION_OPEN_TIMEOUT
              ).pipe(mergeMapTo(throwError(TimeoutError))),
            ])
          )
        );
    }

    const subscription = eventStream.subscribe(
      onAllConnectionEventReceive,
      onAllConnectionErrorReceive
    );

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
