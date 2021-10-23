import compose from "./compose";

describe("Compose higher-order functions", () => {
  it("Should compose higher-order functions correctly", async () => {
    // Setup
    const originalFN = async (args: number) => {
      return args;
    };

    // When
    const composer = compose<typeof originalFN>(
      (fn) => {
        return async (args) => {
          return (await fn(args)) + 2;
        };
      },
      (fn) => {
        return async (args) => {
          return (await fn(args)) * 3;
        };
      },
      (fn) => {
        return async (args) => {
          return (await fn(args)) - 1;
        };
      }
    );

    // Then
    expect(await composer(originalFN)(2)).toEqual(11);
  });
});
