import { asyncTimeout } from ".";
import createSwitchAsyncFunction from "./switch_async";

describe("Switch async function", () => {
  it("Should cancel old action when new action invoked", async () => {
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
    expect(callback).toHaveBeenCalledWith(undefined);
  });
});
