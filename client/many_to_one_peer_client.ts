import { interval, Observable, Subject, Subscription } from "rxjs";
import { finalize, flatMap, take, takeUntil, tap } from "rxjs/operators";
import {
  ManyToOnePeerClient,
  PeerClient,
  PeerClientFactory,
} from "../interface";
import createEventEmitterClient from "./event_emitter_client";
import { PeerConnection, PeerEvent } from "./peer_client_factory";

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
 * to, and subscribers do not subscribe to each other.
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
  let outgoingConnections: { [x: string]: PeerConnection } = {};
  let peerClient: PeerClient;

  const onPeerEventReceive = (event: PeerEvent<SubscribeeData>) => {
    if (args.type === "SUBSCRIBER" && event.type === "data") {
      eventEmitter.emit("subscribeeDataReceive", event.data);
    }
  };

  const onPeerOrConnectionError = (_error: Error) => {
    eventEmitter.emit("retryElapse", 0);

    const subscription = interval(1000)
      .pipe(take(retryDelay / 1000), takeUntil(retryCancel$))
      .subscribe((i) => {
        eventEmitter.emit("retryElapse", (i + 1) * 1000);
        if (i === retryDelay / 1000 - 1) initialize();
      });

    compositeSubscription.add(subscription);
  };

  const deinitialize = async () => {
    outgoingConnections = {};
    compositeSubscription.unsubscribe();
    await peerClient?.deinitialize();
  };

  const initialize = async () => {
    if (peerClient == null) {
      let peerID: string;

      if (args.type === "SUBSCRIBER") {
        peerID = args.subscriberID;
      } else {
        peerID = args.subscribeeID;
      }

      peerClient = peerClientFactory.newInstance(peerID);

      compositeSubscription.add(
        retryCancel$.subscribe(() => eventEmitter.emit("retryCancel"))
      );
    }

    retryCancel$.next(undefined);
    await peerClient.initialize();
    let eventStream: Observable<PeerEvent<SubscribeeData>>;

    if (args.type === "SUBSCRIBEE") {
      eventStream = peerClient.onPeerConnection().pipe(
        flatMap((conn) =>
          peerClient.streamPeerEvents<SubscribeeData>(conn).pipe(
            tap((event) => {
              switch (event.type) {
                case "open":
                  eventEmitter.emit("connectionOpen", conn);
                  outgoingConnections[conn.peer] = conn;
                  const count = Object.keys(outgoingConnections).length;
                  eventEmitter.emit("outgoingConnectionUpdate", count);
                  break;

                default:
                  break;
              }
            }),
            finalize(() => {
              delete outgoingConnections[conn.peer];
              const count = Object.keys(outgoingConnections).length;
              eventEmitter.emit("outgoingConnectionUpdate", count);
            })
          )
        )
      );
    } else {
      eventStream = peerClient
        .connectToPeer(args.subscribeeID, { reliable: true })
        .pipe(
          flatMap((conn) => peerClient.streamPeerEvents<SubscribeeData>(conn))
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
