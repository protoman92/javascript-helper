import { wrapClientWithBackoffRetry, wrapFunctionWithRetry } from "./retry";

describe("Wrap with retry", () => {
  it("Wrap function with retry", async () => {
    // Setup
    const retryCount = 3;
    let retried = 0;

    let fn = async () => {
      retried += 1;
      throw new Error("");
    };

    fn = wrapFunctionWithRetry(fn, { times: retryCount });

    // When
    try {
      await fn();
    } catch {
    } finally {
      expect(retried).toEqual(retryCount);
    }
  });

  it("Wrap client with retry", async () => {
    // Setup
    const retryCount = 3;
    let retried = 0;

    let client = {
      a: async (someNumber: number) => {
        retried += 1;
        throw new Error("");
      },
    };

    client = wrapClientWithBackoffRetry(client);

    // When
    try {
      await client.a(0);
    } catch {
    } finally {
      expect(retried).toEqual(retryCount);
    }
  });
});
