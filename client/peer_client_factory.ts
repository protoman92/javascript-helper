import Peer, { DataConnection } from "peerjs";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, flatMap, map } from "rxjs/operators";
import { omitFalsy } from "../utils";

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
    newInstance: (id: string) => {
      let peer: Peer;
      let stateSubject: BehaviorSubject<PeerState | undefined>;
      let closeListener: Parameters<typeof peer["on"]>[1];
      let errListener: Parameters<typeof peer["on"]>[1];
      let openListener: Parameters<typeof peer["on"]>[1];

      function triggerStream() {
        return stateSubject.pipe(filter((state) => state?.type === "open"));
      }

      const peerInstance = {
        connectToPeer: function (...args: Parameters<typeof peer["connect"]>) {
          return triggerStream().pipe(map(() => peer.connect(...args)));
        },
        deinitialize: async () => {
          peer?.off("close", closeListener);
          peer?.off("error", errListener);
          peer?.off("open", openListener);
          peer?.destroy();
        },
        initialize: async () => {
          peerInstance.deinitialize();

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
          peer.on("close", (closeListener = () => stateSubject.complete()));

          peer.on(
            "error",
            (errListener = (error) => stateSubject.error(error))
          );

          peer.on(
            "open",
            (openListener = () => stateSubject.next({ type: "open" }))
          );
        },
        onPeerConnection: () => {
          return triggerStream().pipe(
            flatMap(
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
        streamPeerEvents: <T>(conn: DataConnection) => {
          return new Observable<PeerEvent<T>>((obs) => {
            let connDataListener: Parameters<typeof conn["on"]>[1] | undefined;
            let connErrListener: Parameters<typeof conn["on"]>[1];
            let connCloseListener: Parameters<typeof conn["on"]>[1] | undefined;
            let connOpenListener: Parameters<typeof conn["on"]>[1];
            conn.on("error", (connErrListener = (error) => obs.error(error)));

            conn.on(
              "open",
              (connOpenListener = () => {
                obs.next({ type: "open" });

                conn.on(
                  "data",
                  (connDataListener = (data) => {
                    obs.next({ data, type: "data" });
                  })
                );

                conn.on("close", (connCloseListener = () => obs.complete()));

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
              conn.off("error", connErrListener);
              conn.off("open", connOpenListener);

              if (connDataListener != null) {
                conn.off("data", connDataListener);
              }

              if (connCloseListener != null) {
                conn.off("close", connCloseListener);
              }

              if (conn.peerConnection != null) {
                conn.peerConnection.onconnectionstatechange = null;
              }

              conn.close();
            };
          });
        },
      };

      return peerInstance;
    },
  };
}
