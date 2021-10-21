import { flipMutualExclusiveFlags } from ".";

describe("Flip exclusive flags", () => {
  it("Should work correctly", async () => {
    // Setup
    const allFlags = { a: true, b: true, c: true };
    const mappers = { a: () => 1, b: () => 2, c: () => 3 };
    const flipperWithMappers = flipMutualExclusiveFlags({ mappers });

    // When
    expect(
      flipMutualExclusiveFlags({
        allFlags,
        flagToSetTrue: "a",
      })
    ).toMatchSnapshot();

    expect(
      flipMutualExclusiveFlags({
        allFlags,
        flagToSetTrue: "b",
      })
    ).toMatchSnapshot();

    expect(
      flipMutualExclusiveFlags({
        allFlags,
        mappers,
        flagToSetTrue: "a",
      })
    ).toMatchSnapshot();

    expect(
      flipMutualExclusiveFlags({
        allFlags,
        mappers,
        flagToSetTrue: "b",
      })
    ).toMatchSnapshot();

    expect(
      flipperWithMappers({
        allFlags,
        flagToSetTrue: "a",
      })
    ).toMatchSnapshot();

    expect(
      flipperWithMappers({
        allFlags,
        flagToSetTrue: "b",
      })
    ).toMatchSnapshot();
  });

  it("Flipper with pre-supplied mappers should maintain type-safety", async () => {
    // Setup
    const flipper = flipMutualExclusiveFlags({
      mappers: { a: (f) => !f, b: (f) => !f },
    });

    // When && Then
    expect(
      flipper({ allFlags: { a: true, b: true }, flagToSetTrue: "a" })
    ).toMatchSnapshot();

    expect(
      flipper({ allFlags: { a: true, b: true }, flagToSetTrue: "b" })
    ).toMatchSnapshot();

    expect(
      flipper({
        allFlags: { a: true, b: true, c: true } as any,
        flagToSetTrue: "a",
      })
    ).toMatchSnapshot();
  });
});
