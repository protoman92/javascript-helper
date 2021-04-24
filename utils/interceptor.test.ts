import createInterceptorRegistry from "./interceptor";

describe("Generic interceptor", () => {
  it("Add and remove interceptors should work", async () => {
    // Setup
    const registry = createInterceptorRegistry<(...args: any[]) => number>({
      resultCombiner: (...args) => args.reduce((acc, v = 0) => acc + v, 0),
    });

    const intercept1 = jest.fn();
    const intercept2 = jest.fn();
    intercept1.mockResolvedValueOnce(0);
    intercept2.mockResolvedValueOnce(0);

    // When
    registry.addInterceptor(intercept1);
    registry.addInterceptor(intercept2);
    const result1 = await registry.intercept(1, 2, 3);
    registry.removeInterceptor(intercept1);
    registry.removeInterceptor(intercept2);
    const result2 = await registry.intercept(1, 2, 3);

    // Then
    expect(registry.interceptorType).toBeInstanceOf(Function);
    expect(intercept1).toHaveBeenCalledTimes(1);
    expect(intercept2).toHaveBeenCalledTimes(1);
    expect(intercept1.mock.calls).toMatchSnapshot();
    expect(intercept2.mock.calls).toMatchSnapshot();
    expect(result1).toEqual(0);
    expect(result2).toEqual(undefined);
  });
});
