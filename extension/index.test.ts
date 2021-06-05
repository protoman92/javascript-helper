import ".";

describe("Array extensions", () => {
  it("First and last should work correctly", () => {
    // Setup && When && Then
    expect([1, 2].first()).toEqual(1);
    expect([1, 2].last()).toEqual(2);
    expect([].last()).toEqual(undefined);
  });

  it("Compact map should work correctly", () => {
    // Setup
    const arr = [1, undefined, 2, null, 3];

    // When && Then
    expect(arr.compactMap()).toEqual([1, 2, 3]);
    expect(arr.compactMap(() => undefined)).toEqual([]);
    expect(arr.compactMap()).not.toEqual(arr);
  });

  it("Merge elements should work", () => {
    // Setup
    const arr = [{ a: 1 }, { b: 2 }, { c: 3 }];

    // When
    expect(arr.mergeElements()).toEqual({ a: 1, b: 2, c: 3 });
  });
});
