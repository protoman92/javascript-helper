import Peer, { DataConnection } from "peerjs";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, map, switchMap } from "rxjs/operators";
import { PeerClient, PeerConnection, PeerEvent, PeerState } from "../interface";
import { omitFalsy } from "../utils";

interface PeerClientFactoryArgs {
  readonly env: string;
  readonly host?: string;
  readonly port?: number;
  readonly key?: string;
  readonly path?: string;
  readonly retryDelay?: number;
}

export default function ({
  env,
  host,
  key,
  path,
  port,
}: PeerClientFactoryArgs) {
  return {
    newInstance: (id: string): PeerClient => {
      let peer: Peer;
      let stateSubject: BehaviorSubject<PeerState | undefined>;

      function trigger$() {
        return stateSubject.pipe(filter((state) => state?.type === "OPEN"));
      }

      function onPeerClose() {
        stateSubject.complete();
      }

      function onPeerDisconnect() {
        peer.reconnect();
      }

      function onPeerError(error: Error) {
        stateSubject.next({ error, type: "ERROR" });
      }

      function onPeerOpen(peerID: string) {
        stateSubject.next({ peerID, type: "OPEN" });
      }

      const peerClient: PeerClient = {
        connectToPeer: (...args) => {
          return trigger$().pipe(map(() => peer.connect(...args)));
        },
        deinitialize: async () => {
          peer?.off("close", onPeerClose);
          peer?.off("disconnected", onPeerDisconnect);
          peer?.off("error", onPeerError);
          peer?.off("open", onPeerOpen);
          peer?.destroy();
        },
        initialize: async () => {
          peerClient.deinitialize();

          peer = new Peer(
            id,
            omitFalsy({
              host,
              key,
              path,
              port,
              debug: env === "production" ? undefined : undefined,
            })
          );

          stateSubject = new BehaviorSubject<PeerState | undefined>(undefined);
          peer.on("close", onPeerClose);
          peer.on("disconnected", onPeerDisconnect);

          /**
           * If connection to the server is disrupted, an error event will be
           * emitted. However, the connection will open again once the server
           * is restored.
           */
          peer.on("error", onPeerError);

          /** This event will trigger again if the server is restored */
          peer.on("open", onPeerOpen);
        },
        map: (fn) => fn(peerClient),
        onPeerConnection: () => {
          return trigger$().pipe(
            switchMap(
              () =>
                new Observable<DataConnection>((obs) => {
                  let connListener: Parameters<typeof peer["on"]>[1];

                  peer.on(
                    "connection",
                    (connListener = (conn) => obs.next(conn))
                  );

                  return () => peer.off("connection", connListener);
                })
            )
          );
        },
        peerState$: () => stateSubject,
        streamPeerEvents: <T>(conn: PeerConnection) => {
          const peerID = conn.peer;

          return new Observable<PeerEvent<T>>((obs) => {
            let dataListener: Parameters<typeof conn["on"]>[1] | undefined;
            let errListener: Parameters<typeof conn["on"]>[1];
            let closeListener: Parameters<typeof conn["on"]>[1] | undefined;
            let openListener: Parameters<typeof conn["on"]>[1];
            conn.on("error", (errListener = (error) => obs.error(error)));

            conn.on(
              "open",
              (openListener = () => {
                obs.next({ peerID, type: "OPEN" });

                conn.on(
                  "data",
                  (dataListener = (data) => {
                    obs.next({ peerID, data, type: "DATA" });
                  })
                );

                conn.on("close", (closeListener = () => obs.complete()));

                /**
                 * This callback will take about ~5 seconds to fire after the
                 * peer has been disconnected. It does not matter which callback
                 * calls first, this or 'close', but the end result is the same:
                 * stream completes.
                 */
                conn.peerConnection.oniceconnectionstatechange = function () {
                  if (this.iceConnectionState === "disconnected") {
                    obs.complete();
                  }
                };
              })
            );

            return () => {
              conn.off("error", errListener);
              conn.off("open", openListener);

              if (dataListener != null) {
                conn.off("data", dataListener);
              }

              if (closeListener != null) {
                conn.off("close", closeListener);
              }

              if (conn.peerConnection != null) {
                conn.peerConnection.onconnectionstatechange = null;
              }

              conn.close();
            };
          });
        },
      };

      return peerClient;
    },
  };
}
