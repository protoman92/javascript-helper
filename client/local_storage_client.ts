import createEventEmitterClient from "./event_emitter_client";

interface LocalStorageClientArgs {
  readonly global?: typeof window;
}

type Callbacks = Readonly<{
  change: (key: string, value: string) => void;
  remove: (key: string) => void;
}>;

export function createLocalStorageClient({
  global = window,
}: LocalStorageClientArgs) {
  const eventEmitter = createEventEmitterClient<Callbacks>();
  const currentOn = eventEmitter.on.bind(eventEmitter);
  const currentOff = eventEmitter.off.bind(eventEmitter);

  const changeCallback: Callbacks["change"] = function (...args) {
    global.localStorage.setItem(...args);
  };

  const removeCallback: Callbacks["remove"] = function (...args) {
    global.localStorage.removeItem(...args);
  };

  eventEmitter.on = function (key, callback) {
    const callbackCount = eventEmitter.getCallbackCount(key);

    switch (key) {
      case "change":
        if (callbackCount === 0) currentOn("change", changeCallback);
        break;

      case "remove":
        if (callbackCount === 0) currentOn("remove", removeCallback);
        break;
    }

    currentOn(key, callback);
  };

  eventEmitter.off = function (key, callback) {
    currentOff(key, callback);
    const callbackCount = eventEmitter.getCallbackCount(key);

    switch (key) {
      case "change":
        if (callbackCount === 1) currentOff("change", changeCallback);
        break;

      case "remove":
        if (callbackCount === 1) currentOff("remove", removeCallback);
        break;
    }
  };

  const client = {
    ...eventEmitter,
    /**
     * Beware that there is no replay mechanism for this emission, so if by
     * now the required callbacks have not been set up, you will miss these
     * events.
     */
    emitStartingValues: async function () {
      const currentItems = await client.getItems();

      for (const key in currentItems) {
        const value = currentItems[key];
        client.emit("change", key, value);
      }
    },
    getItem: async function (key: string) {
      return global.localStorage.getItem(key) ?? undefined;
    },
    getItems: async function () {
      const items: Record<string, string> = {};
      const length = global.localStorage.length;

      for (let i = 0; i < length; i += 1) {
        let key: string | null;
        let value: string | null;

        if (
          (key = global.localStorage.key(i)) != null &&
          (value = global.localStorage.getItem(key)) != null
        ) {
          items[key] = value ?? undefined;
        }
      }

      return items;
    },
  };

  return client;
}

const defaultLocalStorageClient = createLocalStorageClient({});
export { defaultLocalStorageClient };
