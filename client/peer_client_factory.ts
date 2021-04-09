import Peer, { DataConnection } from "peerjs";
import { BehaviorSubject, Observable, of } from "rxjs";
import { PeerClient, PeerConnection, PeerEvent, PeerState } from "../interface";
import { omitNull } from "../utils";

interface PeerClientFactoryArgs {
  readonly env: string;
  readonly host?: string;
  readonly port?: number;
  readonly key?: string;
  readonly secure?: boolean;
  readonly path?: string;
}

const PEER_STATE_UNITIALIZED: PeerState = { type: "UNITIALIZED" };

export default function ({
  env,
  host,
  key,
  path,
  port,
  secure,
}: PeerClientFactoryArgs) {
  return {
    newInstance: (id: string): PeerClient => {
      const peer = new Peer(
        id,
        omitNull({
          host,
          key,
          path,
          port,
          secure,
          debug: env === "production" ? undefined : undefined,
        })
      );

      const stateSubject = new BehaviorSubject(PEER_STATE_UNITIALIZED);

      function onPeerClose() {
        stateSubject.complete();
      }

      function onPeerDisconnect() {
        peer.reconnect();
      }

      function onPeerError(error: PeerState.PeerError["error"]) {
        switch (error.type) {
          /**
           * Do not error out peer state if this error is encountered, since
           * it is retryable.
           */
          case "peer-unavailable":
            break;

          default:
            stateSubject.next({ error, type: "ERROR" });
            break;
        }
      }

      function onPeerOpen(peerID: string) {
        stateSubject.next({ peerID, type: "OPEN" });
      }

      const peerClient: PeerClient = {
        connectToPeer: (...args) => {
          return of(peer.connect(...args));
        },
        deinitialize: async () => {
          peer.off("close", onPeerClose);
          peer.off("disconnected", onPeerDisconnect);
          peer.off("error", onPeerError);
          peer.off("open", onPeerOpen);
          peer.disconnect();
          peer.destroy();
        },
        initialize: async () => {
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

          peer.disconnect();
          peer.reconnect();
        },
        onPeerConnection: () => {
          return new Observable<DataConnection>((obs) => {
            function onConnection(conn: PeerConnection) {
              obs.next(conn);
            }

            peer.on("connection", onConnection);
            return () => peer.off("connection", onConnection);
          });
        },
        peerState$: () => stateSubject,
        streamPeerEvents: <T>(conn: PeerConnection) => {
          const peerID = conn.peer;

          return new Observable<PeerEvent<T>>((obs) => {
            function onClose() {
              obs.complete();
            }

            function onData(data: T) {
              obs.next({ data, peerID, type: "DATA" });
            }

            function onError(error: Error) {
              obs.error(error);
            }

            function onOpen() {
              obs.next({ peerID, type: "OPEN" });
              conn.on("data", onData);
              conn.on("close", onClose);

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
            }

            conn.on("error", onError);
            conn.on("open", onOpen);

            return () => {
              conn.off("error", onError);
              conn.off("open", onOpen);
              conn.off("data", onData);
              conn.off("close", onClose);

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
