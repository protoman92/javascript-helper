import { deepClone, omitDeep, stripLeadingSlash } from ".";

describe("General utilities", () => {
  it("Strip leading slashes should work correctly", async () => {
    // Setup
    // When
    // Then
    expect(stripLeadingSlash("////abc")).toEqual("abc");
  });

  it("Deep clone should work correctly", () => {
    // Setup
    // When
    const deepCloned = deepClone({ a: { b: { c: { d: 1, e: "1" } } } })(
      (...[, value]) => {
        if (typeof value === "number") return value.toString();
        return value;
      },
      (...[, value]) => {
        if (typeof value === "string") return parseInt(value);
        return value;
      }
    )(
      (...[, value]) => {
        if (typeof value === "number") return value * 10;
        return value;
      },
      (...[, value]) => {
        if (typeof value === "number") return value.toString();
        return value;
      }
    );

    // Then
    expect(deepCloned).toMatchSnapshot();
  });

  it("Omit deep should work correctly", () => {
    // Setup
    expect(
      omitDeep({ a: 1, b: { a: 1, c: { a: 1, b: 2, d: 3 } } }, "a", "d")
    ).toMatchSnapshot();

    expect(omitDeep(1 as any, "a")).toMatchSnapshot();
    expect(omitDeep([1, 2, 3], "a")).toMatchSnapshot();

    expect(
      omitDeep([1, 2, { a: { a: {} }, b: { a: 1 } }], "a")
    ).toMatchSnapshot();

    expect(
      omitDeep(new Set([{ a: 1, b: new Set([{ a: 1 }]) }, { b: 2 }]), "a")
    ).toMatchSnapshot();

    expect(
      omitDeep(
        new Map([
          ["key1", { a: 1, b: new Map([["key3", { a: 2 }]]) }],
          ["key2", { b: 2 }],
        ]),
        "a"
      )
    ).toMatchSnapshot();

    expect(omitDeep(new Date(), "a")).toBeInstanceOf(Date);
    expect(omitDeep(null, "a")).toEqual(null);
    expect(omitDeep(undefined, "a")).toEqual(undefined);
  });
});
