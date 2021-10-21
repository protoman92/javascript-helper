import applyPolyfill from ".";
import { mockSomething } from "@haipham/javascript-helper-utils";

describe("Set timout polyfill", () => {
  const MAX_DELAY = Math.pow(2, 31) - 1;
  let setTimeout: jest.Mock;
  let global: typeof window;

  beforeEach(() => {
    setTimeout = jest.fn();
    global = mockSomething<typeof global>({ setTimeout: setTimeout as any });

    setTimeout.mockImplementation((handler, timeout, ...args) => {
      handler(...args, timeout);
    });

    applyPolyfill(global);
  });

  it("Should have the same behavior as normal timeout if delay is 0 or less than max", () => {
    // Setup
    const handler = jest.fn();

    // When && Then
    global.setTimeout(handler, undefined, 1, 2, 3);
    global.setTimeout(handler, NaN, 1, 2, 3);
    global.setTimeout(handler, 0, 1, 2, 3);
    global.setTimeout(handler, MAX_DELAY - 1, 1, 2, 3);

    // Then
    expect(handler.mock.calls).toMatchSnapshot();
  });

  it("Should nest timeouts if delay is more than max", () => {
    // Setup
    const handler = jest.fn();

    // When && Then
    global.setTimeout(handler, MAX_DELAY * 10 + 400, 1, 2, 3);

    // Then
    expect(handler.mock.calls).toMatchSnapshot();
  });
});
