import createAsyncSynchronizer from "./synchronize_async";

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
});
