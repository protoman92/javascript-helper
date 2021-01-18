import { interval, Observable, Subject, Subscription } from "rxjs";
import { finalize, mergeMap, take, takeUntil, tap } from "rxjs/operators";
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
    readonly subscriberID: string;
    readonly type: "SUBSCRIBER";
  }
}

export type ManyToOnePeerClientArgs =
  | ManyToOnePeerClientArgs.ForSubscribee
  | ManyToOnePeerClientArgs.ForSubscriber;

const RETRY_DELAY_PEER_ERROR_DEFAULT = 5000;

/**
 * This peer client assumes there is a subscribee that everyone else subscribes
 * to, and subscribers do not subscribe to each other. It can be used as the
 * base to build more complex functionalities, such as many-to-many peer client.
 */
export default function <SubscribeeData>({
  peerClientFactory,
  retryDelay = RETRY_DELAY_PEER_ERROR_DEFAULT,
  ...args
}: ManyToOnePeerClientArgs) {
  const eventEmitter = createEventEmitterClient<
    ManyToOnePeerClient.Callbacks<SubscribeeData>
  >();

  const compositeSubscription: Subscription = new Subscription();
  const retryCancel$ = new Subject<void>();
  let outgoingConnections: Map<string, PeerConnection> = new Map();
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

  const onPeerEventReceive = (event: PeerEvent<SubscribeeData>) => {
    if (args.type === "SUBSCRIBER" && event.type === "data") {
      eventEmitter.emit("subscribeeDataReceive", event.data);
    }
  };

  const onPeerOrConnectionError = (_error: Error) => {
    eventEmitter.emit("retryElapse", 0);

    const subscription = interval(1000)
      .pipe(take(retryDelay / 1000), takeUntil(retryCancel$))
      .subscribe(async (i) => {
        eventEmitter.emit("retryElapse", (i + 1) * 1000);
        if (i === retryDelay / 1000 - 1) await initialize();
      });

    compositeSubscription.add(subscription);
  };

  const deinitialize = async () => {
    outgoingConnections = new Map();
    compositeSubscription.unsubscribe();
    await peerClient.deinitialize();
  };

  const initialize = async () => {
    retryCancel$.next(undefined);
    await peerClient.initialize();
    let eventStream: Observable<PeerEvent<SubscribeeData>>;

    if (args.type === "SUBSCRIBEE") {
      eventStream = peerClient.onPeerConnection().pipe(
        mergeMap((conn) =>
          peerClient.streamPeerEvents<SubscribeeData>(conn).pipe(
            tap((event) => {
              switch (event.type) {
                case "open":
                  eventEmitter.emit("connectionOpen", conn);
                  outgoingConnections.set(conn.peer, conn);

                  eventEmitter.emit("outgoingConnectionUpdate", {
                    allPeers: [...outgoingConnections.keys()].map((key) => ({
                      id: key,
                    })),
                    joiningPeerID: conn.peer,
                    type: "PEER_JOINING",
                  });

                  break;

                default:
                  break;
              }
            }),
            finalize(() => {
              outgoingConnections.delete(conn.peer);

              eventEmitter.emit("outgoingConnectionUpdate", {
                allPeers: [...outgoingConnections.keys()].map((key) => ({
                  id: key,
                })),
                leavingPeerID: conn.peer,
                type: "PEER_LEAVING",
              });
            })
          )
        )
      );
    } else {
      eventStream = peerClient
        .connectToPeer(args.subscribeeID, { reliable: true })
        .pipe(
          mergeMap((conn) => peerClient.streamPeerEvents<SubscribeeData>(conn))
        );
    }

    const subscription = eventStream.subscribe(
      onPeerEventReceive,
      onPeerOrConnectionError
    );

    compositeSubscription.add(subscription);
  };

  const manyToOneClient: ManyToOnePeerClient<SubscribeeData> = {
    ...(eventEmitter as Pick<
      typeof eventEmitter,
      "callbacksType" | "on" | "off"
    >),
    deinitialize,
    initialize,
    sendMessage: (data: SubscribeeData) => {
      for (const conn of Object.values(outgoingConnections)) conn.send(data);
    },
  };

  return manyToOneClient;
}
