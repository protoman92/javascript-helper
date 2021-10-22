import { createAsyncSynchronizer } from ".";
import { decorateClientMethods } from "@haipham/javascript-helper-utils";

describe("Request synchronizer", () => {
  it("Should synchronize requests correctly", async () => {
    // Setup
    const keyCount = 10;
    const synchronizer = createAsyncSynchronizer();
    let cache: Record<string, number> = {};

    const requests = [...Array(keyCount).keys()]
      .map((index) => {
        return async () => {
          return index;
        };
      })
      .map((args, index) => {
        return async () => {
          if (
            cache[index] == null &&
            (index === 0 || cache[index - 1] != null)
          ) {
            cache[index] = await args();
          }

          return cache[index];
        };
      });

    // When: without synchronizer
    await Promise.all(
      requests.map((args) => {
        return args();
      })
    );

    expect(Object.keys(cache)).not.toHaveLength(keyCount);

    // When: with synchronizer
    cache = {};

    await Promise.all(
      requests.map(synchronizer.synchronize).map((args) => {
        return args();
      })
    );

    expect(Object.keys(cache)).toHaveLength(keyCount);
    expect(Object.values(cache)).toEqual([...Array(keyCount).keys()]);
  });

  it("Should synchronize all client methods correctly", async () => {
    // Setup
    const synchronizer = createAsyncSynchronizer();

    const client = {
      method1: async function () {
        return this;
      },
      method2: async () => {
        return 1;
      },
    };

    // When
    const synchronizedClient = decorateClientMethods<typeof client>({
      decorator: synchronizer.synchronize,
    })(client);

    // Then
    expect(synchronizedClient.method1.name).toEqual("bound synchronized");
    expect(synchronizedClient.method2.name).toEqual("bound synchronized");
    expect(await synchronizedClient.method1()).toStrictEqual(client);
    expect(await synchronizedClient.method2()).toEqual(1);
  });
});
