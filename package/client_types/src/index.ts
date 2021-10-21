import {
  GenericFunction,
  GenericObject,
  Promisified,
} from "@haipham/javascript-helper-essential-types";

export interface LifecycleAware {
  initialize(): Promise<void>;
  deinitialize(): Promise<void>;
}

export interface MessageSender<T> {
  sendMessage(message: T): void;
}

export type PromisifiedClient<C extends GenericObject, K extends keyof C> = {
  [x in keyof Pick<C, K>]: C[x] extends GenericFunction
    ? Promisified<C[x]>
    : C[x];
} & Omit<C, K>;
