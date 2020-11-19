import { EventEmitterClient } from "../interface";
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
}: LocalStorageClientArgs): EventEmitterClient<Callbacks> {
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

  return eventEmitter;
}

const defaultLocalStorageClient = createLocalStorageClient({});
export { defaultLocalStorageClient };
