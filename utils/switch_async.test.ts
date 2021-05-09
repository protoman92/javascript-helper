import { asyncTimeout } from ".";
import createSwitchAsyncFunction from "./switch_async";

describe("Switch async function", () => {
  it("Should not resolve with stale results", async () => {
    // Setup
    const callback = jest.fn();
    const newFunction = createSwitchAsyncFunction(async () => {}, callback);

    // When
    for (let index = 0; index < 1000; index += 1) {
      newFunction();
    }

    await asyncTimeout(0);

    // Then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ result: undefined });
  });

  it("Should not reject with stale errors", async () => {
    // Setup
    const callback = jest.fn();

    const newFunction = createSwitchAsyncFunction(async (args: number) => {
      throw new Error(args.toString());
    }, callback);

    // When
    for (let index = 0; index < 1000; index += 1) {
      newFunction(index);
    }

    await asyncTimeout(0);

    // Then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ error: new Error("999") });
  });
});
