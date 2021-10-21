export interface EventEmitterClient<
  CB extends { [x: string]: (...args: any[]) => void }
> {
  /** Use this only for type checking. It will not give the actual callbacks */
  callbacksType: CB;
  emit<K extends keyof CB>(key: K, ...args: Parameters<CB[K]>): void;
  getCallbackCount<K extends keyof CB>(key: K): number;
  on<K extends keyof CB>(key: K, callback: CB[K]): () => void;
  off<K extends keyof CB>(key: K, callback: CB[K]): void;
  offAll(): void;
}

/**
 * Provide a common interface for event emittance, with on/off for registering
 * event callbacks.
 */
export function createEventEmitterClient<
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

      return () => {
        client.off(key, callback);
      };
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
