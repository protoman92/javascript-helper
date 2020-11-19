import { EventEmitterClient } from "../interface";

/**
 * Provide a common interface for event emittance, with on/off for registering
 * event callbacks.
 */
export default function <
  Callbacks extends { [x: string]: (...args: any[]) => void }
>() {
  const callbacks: Partial<{ [x in keyof Callbacks]: Callbacks[x][] }> = {};

  const client: EventEmitterClient<Callbacks> = {
    callbacksType: {} as Callbacks,
    emit: function <K extends keyof Callbacks>(
      key: K,
      ...args: Parameters<Callbacks[K]>
    ) {
      if (callbacks[key] == null) return;
      for (const callback of callbacks[key]!) callback(...args);
    },
    getCallbackCount: function <K extends keyof Callbacks>(key: K) {
      return callbacks[key]?.length || 0;
    },
    on: function <K extends keyof Callbacks>(key: K, callback: Callbacks[K]) {
      if (callbacks[key] == null) callbacks[key] = [];
      callbacks[key]!.push(callback);
    },
    off: function <K extends keyof Callbacks>(key: K, callback: Callbacks[K]) {
      if (callbacks[key] == null) return;
      const index = callbacks[key]!.findIndex((cb: any) => cb === callback);
      if (index === -1) return;
      callbacks[key]!.splice(index, 1);
    },
  };

  return client;
}
