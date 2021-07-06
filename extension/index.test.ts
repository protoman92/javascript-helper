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

  it("Slice right should work", () => {
    // Setup
    const arr = [1, 2, 3, 4];

    // When && Then
    expect(arr.sliceRight(0, 0)).toEqual([]);
    expect(arr.sliceRight(0, 1)).toEqual([4]);
    expect(arr.sliceRight(1, 3)).toEqual([2, 3]);
    expect(arr.sliceRight(2)).toEqual([1, 2]);
  });

  it("toMap should work", () => {
    // Setup
    const arr = [{ a: 1 }, { a: 2 }, { a: 3 }];

    // When && Then
    expect(arr.toMap("a")).toMatchSnapshot();
    expect(arr.toMap(({ a }) => a)).toMatchSnapshot();
    expect(arr.toMap(({ a }) => `${a}`)).toMatchSnapshot();
  });
});
