import { EventEmitterClient } from "../interface";

/**
 * Provide a common interface for event emittance, with on/off for registering
 * event callbacks.
 */
export default function <
  CB extends { [x: string]: (...args: any[]) => void }
>() {
  let callbacks: Partial<{ [x in keyof CB]: CB[x][] }> = {};

  const client: EventEmitterClient<CB> = {
    callbacksType: {} as CB,
    emit: <K extends keyof CB>(key: K, ...args: Parameters<CB[K]>) => {
      if (callbacks[key] == null) {
        return;
      }

      for (const callback of callbacks[key]!) {
        callback(...args);
      }
    },
    getCallbackCount: <K extends keyof CB>(key: K) => {
      return callbacks[key]?.length || 0;
    },
    on: <K extends keyof CB>(key: K, callback: CB[K]) => {
      if (callbacks[key] == null) {
        callbacks[key] = [];
      }

      callbacks[key]!.push(callback);
    },
    off: <K extends keyof CB>(key: K, callback: CB[K]) => {
      if (callbacks[key] == null) {
        return;
      }

      const index = callbacks[key]!.findIndex((cb) => cb === callback);

      if (index === -1) {
        return;
      }

      callbacks[key]!.splice(index, 1);
    },
    offAll: () => {
      callbacks = {};
    },
  };

  return client;
}
