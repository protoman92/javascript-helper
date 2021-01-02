import { EventEmitterClient } from "../interface";
import createEventEmitter from "./event_emitter_client";

describe("Event emitter client", () => {
  let eventEmitter: EventEmitterClient<{
    test: (a: number, b: number) => void;
  }>;

  beforeEach(() => {
    eventEmitter = createEventEmitter();
    expect(eventEmitter.callbacksType).toBeTruthy();
  });

  it("On and off should work correctly", async () => {
    // Setup && When && Then
    const callback = jest.fn();

    eventEmitter.on("test", callback);
    eventEmitter.emit("test", 0, 0);
    expect(eventEmitter.getCallbackCount("test")).toEqual(1);

    eventEmitter.off("test", callback);
    eventEmitter.emit("test", 0, 0);
    expect(eventEmitter.getCallbackCount("test")).toEqual(0);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(0, 0);
  });

  it("Off with no existing callback should not throw error", () => {
    // Setup
    const callback = jest.fn();

    // When
    eventEmitter.off("test", callback);

    // Then
    expect(eventEmitter.getCallbackCount("test")).toEqual(0);
  });

  it("Off all should remove all callbacks", () => {
    // Setup
    const callback = jest.fn();

    // When
    eventEmitter.on("test", callback);
    eventEmitter.offAll();

    // Then
    expect(eventEmitter.getCallbackCount("test")).toEqual(0);
  });

  it("Emitting with unsupported key should do nothing", () => {
    // Setup
    const callback = jest.fn();
    eventEmitter.on("test", callback);

    // When
    eventEmitter.emit("test1" as any);

    // Then
    expect(callback).not.toHaveBeenCalled();
  });
});
